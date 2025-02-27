import os
import json
import logging
from typing import List, Dict, Any
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DocumentIndexer:
    def __init__(self, docs_dir: str, index_save_path: str = 'data/index'):
        self.docs_dir = docs_dir
        self.index_save_path = index_save_path
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.document_chunks = []
        self.chunk_size = 512  # Characters per chunk
        self.cdp_names = ['segment', 'mparticle', 'lytics', 'zeotap']
        
        # Create index directory
        if not os.path.exists(self.index_save_path):
            os.makedirs(self.index_save_path)
    
    def load_documents(self) -> None:
        """Load all documents from scraped docs directory"""
        for cdp_name in self.cdp_names:
            cdp_path = os.path.join(self.docs_dir, cdp_name)
            if not os.path.exists(cdp_path):
                logging.warning(f"Path does not exist: {cdp_path}")
                continue
                
            logging.info(f"Loading documents for {cdp_name}...")
            all_docs_file = os.path.join(cdp_path, 'all_docs.json')
            
            if os.path.exists(all_docs_file):
                try:
                    with open(all_docs_file, 'r', encoding='utf-8') as f:
                        docs = json.load(f)
                        for doc in docs:
                            doc['cdp'] = cdp_name
                            self.documents.append(doc)
                except Exception as e:
                    logging.error(f"Error loading {all_docs_file}: {str(e)}")
            else:
                # Fall back to individual files
                for filename in os.listdir(cdp_path):
                    if filename.endswith('.json') and filename != 'all_docs.json':
                        try:
                            with open(os.path.join(cdp_path, filename), 'r', encoding='utf-8') as f:
                                doc = json.load(f)
                                doc['cdp'] = cdp_name
                                self.documents.append(doc)
                        except Exception as e:
                            logging.error(f"Error loading {filename}: {str(e)}")
        
        logging.info(f"Loaded {len(self.documents)} documents in total")
    
    def chunk_documents(self) -> None:
        """Split documents into smaller chunks for indexing"""
        logging.info("Chunking documents...")
        for doc in self.documents:
            text = doc['content']
            title = doc['title']
            url = doc['url']
            cdp = doc['cdp']
            
            # Simple chunking strategy: split by paragraphs then combine until chunk_size
            paragraphs = text.split('\n\n')
            current_chunk = ""
            
            for paragraph in paragraphs:
                if not paragraph.strip():
                    continue
                    
                if len(current_chunk) + len(paragraph) <= self.chunk_size:
                    current_chunk += paragraph + "\n\n"
                else:
                    if current_chunk:
                        self.document_chunks.append({
                            'chunk_text': current_chunk.strip(),
                            'title': title,
                            'url': url,
                            'cdp': cdp
                        })
                    current_chunk = paragraph + "\n\n"
            
            # Add the last chunk
            if current_chunk:
                self.document_chunks.append({
                    'chunk_text': current_chunk.strip(),
                    'title': title,
                    'url': url,
                    'cdp': cdp
                })
        
        logging.info(f"Created {len(self.document_chunks)} chunks")
    
    def create_index(self) -> None:
        """Create FAISS index from document chunks"""
        logging.info("Creating embeddings and index...")
        
        # Create embeddings for all chunks
        texts = [chunk['chunk_text'] for chunk in self.document_chunks]
        embeddings = self.model.encode(texts)
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Create and train index
        vector_dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(vector_dimension)
        index.add(embeddings)
        
        # Save index
        faiss.write_index(index, os.path.join(self.index_save_path, 'docs.index'))
        
        # Save metadata
        with open(os.path.join(self.index_save_path, 'chunks.json'), 'w', encoding='utf-8') as f:
            json.dump(self.document_chunks, f, ensure_ascii=False, indent=2)
        
        logging.info("Index created and saved successfully")
    
    def process(self) -> None:
        """Run the full indexing process"""
        self.load_documents()
        self.chunk_documents()
        self.create_index()

def main():
    docs_dir = 'data/scraped_docs'
    index_save_path = 'data/index'
    
    indexer = DocumentIndexer(docs_dir, index_save_path)
    indexer.process()

if __name__ == "__main__":
    main()