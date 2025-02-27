import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DocumentationScraper:
    def __init__(self, base_url, output_dir, cdp_name):
        self.base_url = base_url
        self.output_dir = os.path.join(output_dir, cdp_name)
        self.cdp_name = cdp_name
        self.visited_urls = set()
        self.doc_data = []
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Create output directory
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def url_belongs_to_docs(self, url):
        """Check if URL belongs to documentation section"""
        parsed_base = urlparse(self.base_url)
        parsed_url = urlparse(url)
        return parsed_url.netloc == parsed_base.netloc and parsed_base.path in parsed_url.path
    
    def extract_content(self, soup):
        """Extract relevant content from page"""
        # Remove navigation, sidebar, footer, etc.
        for element in soup.select('nav, footer, .sidebar, .menu, .navigation, script, style, header'):
            element.extract()
        
        # Get title
        title = soup.title.text if soup.title else "No Title"
        
        # Get main content
        main_content = soup.select_one('main, article, .content, .documentation, #content, .main-content')
        if not main_content:
            main_content = soup.body
        
        # Extract text content
        content = ""
        if main_content:
            # Get all paragraphs, headings, lists, and code blocks
            for element in main_content.select('p, h1, h2, h3, h4, h5, h6, ul, ol, li, pre, code'):
                text = element.get_text(strip=True)
                if text:
                    tag_name = element.name
                    if tag_name.startswith('h'):
                        content += f"\n## {text}\n"
                    elif tag_name in ['ul', 'ol']:
                        continue  # We'll get the list items individually
                    elif tag_name == 'li':
                        content += f"- {text}\n"
                    elif tag_name in ['pre', 'code']:
                        content += f"\n```\n{text}\n```\n"
                    else:
                        content += f"{text}\n"
        
        return {
            'title': title,
            'content': content.strip(),
        }
    
    def scrape_page(self, url):
        """Scrape a single page and extract links to other documentation pages"""
        if url in self.visited_urls or not self.url_belongs_to_docs(url):
            return []
        
        self.visited_urls.add(url)
        logging.info(f"Scraping: {url}")
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract content
            page_data = self.extract_content(soup)
            page_data['url'] = url
            self.doc_data.append(page_data)
            
            # Save individual page
            filename = str(len(self.doc_data)).zfill(4) + '.json'
            with open(os.path.join(self.output_dir, filename), 'w', encoding='utf-8') as f:
                json.dump(page_data, f, indent=2)
            
            # Find all links
            links = []
            for a_tag in soup.find_all('a', href=True):
                href = a_tag['href']
                absolute_url = urljoin(url, href)
                if self.url_belongs_to_docs(absolute_url) and absolute_url not in self.visited_urls:
                    links.append(absolute_url)
            
            # Avoid rate limiting
            time.sleep(1)
            return links
            
        except Exception as e:
            logging.error(f"Error scraping {url}: {str(e)}")
            return []
    
    def scrape(self, max_pages=100):
        """Scrape documentation pages starting from the base URL"""
        logging.info(f"Starting scrape of {self.cdp_name} documentation")
        
        to_visit = [self.base_url]
        page_count = 0
        
        while to_visit and page_count < max_pages:
            current_url = to_visit.pop(0)
            new_links = self.scrape_page(current_url)
            to_visit.extend(new_links)
            page_count += 1
        
        # Save all data in one file
        with open(os.path.join(self.output_dir, 'all_docs.json'), 'w', encoding='utf-8') as f:
            json.dump(self.doc_data, f, indent=2)
        
        logging.info(f"Completed scraping {self.cdp_name}. Total pages: {len(self.doc_data)}")
        return self.doc_data

def main():
    # Define CDPs to scrape
    cdps = [
        {
            'name': 'segment',
            'url': 'https://segment.com/docs/'
        },
        {
            'name': 'mparticle',
            'url': 'https://docs.mparticle.com/'
        },
        {
            'name': 'lytics',
            'url': 'https://docs.lytics.com/'
        },
        {
            'name': 'zeotap',
            'url': 'https://docs.zeotap.com/home/en-us/'
        }
    ]
    
    output_dir = 'data/scraped_docs'
    
    for cdp in cdps:
        scraper = DocumentationScraper(cdp['url'], output_dir, cdp['name'])
        scraper.scrape(max_pages=50)  # Limit to 50 pages per CDP for now

if __name__ == "__main__":
    main()