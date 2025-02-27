import os
import json
import logging
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Tuple
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class QueryEngine:
    def __init__(self, index_path: str = 'data/index'):
        self.index_path = index_path
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = None
        self.chunks = []
        self.load_resources()
        
        # Define CDP-specific patterns
        self.cdp_patterns = {
            'segment': ['segment', 'segment.com', 'segment.io'],
            'mparticle': ['mparticle', 'mparticle.com'],
            'lytics': ['lytics', 'lytics.com', 'lytics.io'],
            'zeotap': ['zeotap', 'zeotap.com']
        }
        
        # Common how-to patterns
        self.how_to_patterns = [
            r'how (?:do|can|to) .+\?',
            r'how (?:do|can|would) i .+\?',
            r'how (?:is|are) .+ (?:set up|configured|created|implemented)',
            r'steps (?:to|for) .+',
            r'guide (?:to|for) .+',
            r'process (?:of|for) .+',
            r'instructions (?:for|to) .+'
        ]
    
    def load_resources(self) -> None:
        """Load index and chunks metadata"""
        try:
            index_file = os.path.join(self.index_path, 'docs.index')
            chunks_file = os.path.join(self.index_path, 'chunks.json')
            
            self.index = faiss.read_index(index_file)
            
            with open(chunks_file, 'r', encoding='utf-8') as f:
                self.chunks = json.load(f)
                
            logging.info(f"Loaded index with {self.index.ntotal} vectors and {len(self.chunks)} chunks")
        except Exception as e:
            logging.error(f"Error loading resources: {str(e)}")
            raise
    
    def detect_cdp(self, query: str) -> str:
        """Detect which CDP the query is referring to"""
        query_lower = query.lower()
        
        for cdp, patterns in self.cdp_patterns.items():
            for pattern in patterns:
                if pattern in query_lower:
                    return cdp
        
        return None  # No specific CDP detected
    
    def is_how_to_question(self, query: str) -> bool:
        """Determine if a query is a how-to question"""
        query_lower = query.lower()
        
        # Check for explicit patterns
        for pattern in self.how_to_patterns:
            if re.search(pattern, query_lower):
                return True
        
        # Check for specific how-to indicators
        how_to_indicators = [
            'how to', 'how do i', 'how can i', 'steps to', 'guide for',
            'instructions for', 'process for', 'method to', 'procedure for'
        ]
        
        for indicator in how_to_indicators:
            if indicator in query_lower:
                return True
        
        return False
    
    def is_comparison_question(self, query: str) -> bool:
        """Determine if a query is asking for a comparison between CDPs"""
        query_lower = query.lower()
        
        # Count mentioned CDPs
        mentioned_cdps = 0
        for cdp_patterns in self.cdp_patterns.values():
            for pattern in cdp_patterns:
                if pattern in query_lower:
                    mentioned_cdps += 1
                    break
        
        # Check for comparison keywords
        comparison_keywords = [
            'compare', 'comparison', 'versus', 'vs', 'difference', 
            'differences', 'similar', 'better', 'best', 'prefer'
        ]
        
        has_comparison_keyword = any(keyword in query_lower for keyword in comparison_keywords)
        
        return mentioned_cdps > 1 or has_comparison_keyword
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant document chunks"""
        # Create query embedding
        query_embedding = self.model.encode([query])
        faiss.normalize_L2(query_embedding)
        
        # Detect specific CDP
        target_cdp = self.detect_cdp(query)
        
        # Search index
        scores, indices = self.index.search(query_embedding, k=top_k * 2)  # Get more results for filtering
        
        # Get results with metadata
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(self.chunks):
                continue
                
            chunk = self.chunks[idx]
            score = scores[0][i]
            
            # If we detected a specific CDP, prioritize chunks from that CDP
            if target_cdp and chunk['cdp'] != target_cdp:
                continue
                
            results.append({
                'score': float(score),
                'chunk_text': chunk['chunk_text'],
                'title': chunk['title'],
                'url': chunk['url'],
                'cdp': chunk['cdp']
            })
        
        # Sort by relevance score and take top_k
        results = sorted(results, key=lambda x: x['score'], reverse=True)[:top_k]
        return results
    
    def answer_question(self, query: str) -> Dict[str, Any]:
        """
        Process a query and generate an answer based on relevant documentation
        Returns a dictionary with answer and context information
        """
        # Check if it's a how-to question
        is_how_to = self.is_how_to_question(query)
        is_comparison = self.is_comparison_question(query)
        
        # If it's neither a how-to question nor a comparison, return an appropriate response
        if not is_how_to and not is_comparison:
            return {
                'answer': "I'm a CDP support assistant designed to answer how-to questions about Segment, mParticle, Lytics, and Zeotap. Could you please rephrase your question as a 'how to' question related to these platforms?",
                'context': [],
                'query_type': 'invalid'
            }
        
        # Search for relevant information
        search_results = self.search(query, top_k=5 if is_comparison else 3)
        
        if not search_results:
            return {
                'answer': "I couldn't find specific information to answer your question. Please try rephrasing or ask about a different aspect of the CDP platforms.",
                'context': [],
                'query_type': 'how_to' if is_how_to else 'comparison'
            }
        
        # For how-to questions, format a clear answer
        if is_how_to:
            # Extract the CDP from the results
            cdp = search_results[0]['cdp']
            
            # Prepare context with the most relevant information
            context_text = "\n\n".join([result['chunk_text'] for result in search_results])
            
            # Create an answer that incorporates the found information
            answer = f"To answer your question about {cdp.capitalize()}, here's how you can do this:\n\n"
            
            # Extract steps from the context if available
            steps = []
            for line in context_text.split('\n'):
                # Look for numbered steps or bullet points
                if re.match(r'^\d+\.|\-|\*', line.strip()):
                    steps.append(line.strip())
            
            if steps:
                answer += "\n".join(steps)
            else:
                # If no clear steps, use the most relevant chunk
                answer += search_results[0]['chunk_text']
            
            # Add source reference
            answer += f"\n\nFor more details, you can refer to: {search_results[0]['url']}"
            
            return {
                'answer': answer,
                'context': search_results,
                'query_type': 'how_to'
            }
            
        # For comparison questions, collect and compare information
        elif is_comparison:
            comparison_answer = "Here's a comparison based on the documentation:\n\n"
            
            # Group results by CDP
            cdp_info = {}
            for result in search_results:
                cdp = result['cdp']
                if cdp not in cdp_info:
                    cdp_info[cdp] = []
                cdp_info[cdp].append(result)
            
            # Create comparison sections
            for cdp, results in cdp_info.items():
                comparison_answer += f"**{cdp.capitalize()}**:\n"
                comparison_answer += results[0]['chunk_text'][:500] + "...\n\n"
            
            # Add summary
            comparison_answer += "\n**Summary**: The CDPs differ in their approaches. "
            for cdp in cdp_info.keys():
                comparison_answer += f"In {cdp.capitalize()}, you would follow their specific documentation at {cdp_info[cdp][0]['url']}. "
            
            return {
                'answer': comparison_answer,
                'context': search_results,
                'query_type': 'comparison'
            }

def main():
    # Test the query engine
    engine = QueryEngine()
    
    test_queries = [
        "How do I set up a new source in Segment?",
        "How can I create a user profile in mParticle?",
        "How do I build an audience segment in Lytics?",
        "How does Segment's audience creation process compare to Lytics'?",
        "Which movie is getting released this week?"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        result = engine.answer_question(query)
        print(f"Query type: {result['query_type']}")
        print(f"Answer: {result['answer'][:200]}...")

if __name__ == "__main__":
    main()