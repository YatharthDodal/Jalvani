from flask import Flask, render_template_string, jsonify, request
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
import os
import json
from datetime import datetime

app = Flask(__name__)

class FAISSRAGBot:
    def __init__(self):
        """Initialize the FAISS RAG Bot"""
        print("🚀 Initializing FAISS RAG Bot...")
        
        try:
            # Initialize embeddings
            print("📊 Loading embeddings model...")
            self.embeddings = HuggingFaceEmbeddings(model_name="intfloat/e5-large-v2")
            
            # Load FAISS index
            print("🔍 Loading FAISS index...")
            self.db = FAISS.load_local("faiss_index", self.embeddings, allow_dangerous_deserialization=True)
            
            # Set up Google API key
            os.environ["GOOGLE_API_KEY"] = "AIzaSyCAqLUT-PskLGVXMyw4i9mAzI6wvYd7YDA"
            
            # Initialize LLM
            print("🤖 Initializing Gemini LLM...")
            self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
            
            # Build RetrievalQA chain
            print("🔗 Building RAG chain...")
            self.qa = RetrievalQA.from_chain_type(
                llm=self.llm,
                retriever=self.db.as_retriever(search_kwargs={"k": 8}),
                chain_type="stuff"
            )
            
            print("✅ FAISS RAG Bot initialized successfully!")
            
        except Exception as e:
            print(f"❌ Error initializing FAISS RAG Bot: {str(e)}")
            raise e
    
    def query(self, question):
        """Query the RAG bot with a question"""
        try:
            print(f"🤔 Processing query: {question}")
            answer = self.qa.run(question)
            print(f"✅ Query processed successfully")
            return answer
        except Exception as e:
            print(f"❌ Error processing query: {str(e)}")
            return f"Sorry, I encountered an error: {str(e)}"
    
    def get_similar_documents(self, query, k=5):
        """Get similar documents for a query"""
        try:
            docs = self.db.similarity_search(query, k=k)
            return docs
        except Exception as e:
            print(f"❌ Error getting similar documents: {str(e)}")
            return []

# Initialize the RAG bot
try:
    rag_bot = FAISSRAGBot()
except Exception as e:
    print(f"❌ Failed to initialize RAG bot: {str(e)}")
    rag_bot = None

# HTML template for the RAG interface
RAG_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Groundwater RAG Bot - FAISS Search</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2em;
            margin: 10px 0;
            opacity: 0.9;
        }
        .chat-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
            margin-bottom: 20px;
        }
        .chat-header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .chat-messages {
            height: 400px;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .message {
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 10px;
            max-width: 80%;
        }
        .user-message {
            background: #007bff;
            color: white;
            margin-left: auto;
            text-align: right;
        }
        .bot-message {
            background: white;
            border: 1px solid #dee2e6;
            margin-right: auto;
        }
        .input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #dee2e6;
        }
        .input-group {
            display: flex;
            gap: 10px;
        }
        .form-control {
            flex: 1;
            padding: 12px 15px;
            border: 2px solid #dee2e6;
            border-radius: 25px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.3s;
        }
        .form-control:focus {
            border-color: #007bff;
        }
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }
        .btn-primary {
            background: #007bff;
            color: white;
        }
        .btn-primary:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #545b62;
        }
        .examples {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .examples h3 {
            color: #2c3e50;
            margin-top: 0;
        }
        .example-queries {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .example-query {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #007bff;
            cursor: pointer;
            transition: all 0.3s;
        }
        .example-query:hover {
            background: #e9ecef;
            transform: translateX(5px);
        }
        .status {
            text-align: center;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .stats {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌊 Groundwater RAG Bot</h1>
            <p>Ask questions about groundwater levels, crop suggestions, and farming advice</p>
        </div>

        <div id="status" class="status" style="display: none;"></div>

        <div class="chat-container">
            <div class="chat-header">
                <h2>💬 Chat with Groundwater Expert</h2>
                <p>Powered by FAISS Vector Search + Gemini AI</p>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <div class="message bot-message">
                    <strong>🤖 Groundwater Bot:</strong> Hello! I'm your groundwater expert. I can help you with:
                    <ul>
                        <li>Groundwater levels in different areas</li>
                        <li>Crop suggestions based on water availability</li>
                        <li>Farming advice and recommendations</li>
                        <li>Water conservation techniques</li>
                    </ul>
                    Ask me anything about groundwater and farming!
                </div>
            </div>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Thinking...</p>
            </div>
            
            <div class="input-container">
                <div class="input-group">
                    <input type="text" class="form-control" id="userInput" placeholder="Ask about groundwater levels, crops, or farming advice..." onkeypress="handleKeyPress(event)">
                    <button class="btn btn-primary" onclick="sendMessage()">Send</button>
                    <button class="btn btn-secondary" onclick="clearChat()">Clear</button>
                </div>
            </div>
        </div>

        <div class="examples">
            <h3>💡 Example Questions</h3>
            <div class="example-queries">
                <div class="example-query" onclick="askQuestion('What is the groundwater level in Amravati in 2024?')">
                    <strong>📍 Location Query:</strong><br>
                    "What is the groundwater level in Amravati in 2024?"
                </div>
                <div class="example-query" onclick="askQuestion('Can you suggest crops suitable for areas with 10m groundwater depth?')">
                    <strong>🌾 Crop Suggestion:</strong><br>
                    "Can you suggest crops suitable for areas with 10m groundwater depth?"
                </div>
                <div class="example-query" onclick="askQuestion('What farming techniques can help conserve water?')">
                    <strong>💧 Water Conservation:</strong><br>
                    "What farming techniques can help conserve water?"
                </div>
                <div class="example-query" onclick="askQuestion('Compare groundwater levels between different districts in Maharashtra')">
                    <strong>📊 Comparison:</strong><br>
                    "Compare groundwater levels between different districts in Maharashtra"
                </div>
                <div class="example-query" onclick="askQuestion('What are the best irrigation methods for areas with poor groundwater?')">
                    <strong>🚿 Irrigation:</strong><br>
                    "What are the best irrigation methods for areas with poor groundwater?"
                </div>
                <div class="example-query" onclick="askQuestion('How does groundwater level affect crop yield?')">
                    <strong>📈 Yield Analysis:</strong><br>
                    "How does groundwater level affect crop yield?"
                </div>
            </div>
        </div>

        <div class="stats">
            <h3>📊 System Status</h3>
            <div id="systemStats">
                <p><strong>FAISS Index:</strong> <span id="faissStatus">Loading...</span></p>
                <p><strong>Embeddings Model:</strong> intfloat/e5-large-v2</p>
                <p><strong>LLM Model:</strong> Gemini 1.5 Flash</p>
                <p><strong>Retrieval Count:</strong> 8 documents per query</p>
            </div>
        </div>
    </div>

    <script>
        let messageCount = 0;

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        function askQuestion(question) {
            document.getElementById('userInput').value = question;
            sendMessage();
        }

        function sendMessage() {
            const userInput = document.getElementById('userInput');
            const question = userInput.value.trim();
            
            if (!question) return;
            
            // Add user message to chat
            addMessage(question, 'user');
            userInput.value = '';
            
            // Show loading
            showLoading(true);
            
            // Send request to backend
            fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question })
            })
            .then(response => response.json())
            .then(data => {
                showLoading(false);
                if (data.success) {
                    addMessage(data.answer, 'bot');
                } else {
                    addMessage('Sorry, I encountered an error: ' + data.error, 'bot');
                }
            })
            .catch(error => {
                showLoading(false);
                addMessage('Sorry, I encountered a network error.', 'bot');
                console.error('Error:', error);
            });
        }

        function addMessage(text, sender) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            const timestamp = new Date().toLocaleTimeString();
            const senderName = sender === 'user' ? 'You' : '🤖 Groundwater Bot';
            
            messageDiv.innerHTML = `
                <strong>${senderName}:</strong><br>
                ${text.replace(/\\n/g, '<br>')}
                <div style="font-size: 0.8em; opacity: 0.7; margin-top: 5px;">${timestamp}</div>
            `;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            messageCount++;
        }

        function clearChat() {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = `
                <div class="message bot-message">
                    <strong>🤖 Groundwater Bot:</strong> Chat cleared! How can I help you with groundwater and farming questions?
                </div>
            `;
            messageCount = 0;
        }

        function showLoading(show) {
            const loading = document.getElementById('loading');
            loading.style.display = show ? 'block' : 'none';
        }

        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = `status ${type}`;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }

        // Check system status on load
        window.onload = function() {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('faissStatus').textContent = data.faiss_loaded ? '✅ Loaded' : '❌ Not Loaded';
                    if (data.faiss_loaded) {
                        showStatus('System ready! Ask me anything about groundwater.', 'success');
                    } else {
                        showStatus('System not ready. Please check FAISS index.', 'error');
                    }
                })
                .catch(error => {
                    document.getElementById('faissStatus').textContent = '❌ Error';
                    showStatus('Failed to check system status.', 'error');
                });
        };
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the main RAG interface"""
    return render_template_string(RAG_TEMPLATE)

@app.route('/api/query', methods=['POST'])
def query_rag():
    """API endpoint to query the RAG bot"""
    try:
        if not rag_bot:
            return jsonify({'success': False, 'error': 'RAG bot not initialized'}), 500
        
        data = request.get_json()
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({'success': False, 'error': 'No question provided'}), 400
        
        # Get answer from RAG bot
        answer = rag_bot.query(question)
        
        return jsonify({
            'success': True,
            'answer': answer,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/status')
def get_status():
    """API endpoint to check system status"""
    try:
        return jsonify({
            'faiss_loaded': rag_bot is not None,
            'embeddings_model': 'intfloat/e5-large-v2',
            'llm_model': 'gemini-1.5-flash',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/similar', methods=['POST'])
def get_similar_documents():
    """API endpoint to get similar documents"""
    try:
        if not rag_bot:
            return jsonify({'success': False, 'error': 'RAG bot not initialized'}), 500
        
        data = request.get_json()
        query = data.get('query', '').strip()
        k = data.get('k', 5)
        
        if not query:
            return jsonify({'success': False, 'error': 'No query provided'}), 400
        
        # Get similar documents
        docs = rag_bot.get_similar_documents(query, k)
        
        # Format documents
        formatted_docs = []
        for doc in docs:
            formatted_docs.append({
                'content': doc.page_content[:200] + '...' if len(doc.page_content) > 200 else doc.page_content,
                'metadata': doc.metadata
            })
        
        return jsonify({
            'success': True,
            'documents': formatted_docs,
            'count': len(formatted_docs)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting FAISS RAG Bot Flask Server...")
    print("=" * 60)
    print("🌐 Server will be available at: http://localhost:5000")
    print("📡 API endpoints:")
    print("   GET  /              - Main RAG interface")
    print("   POST /api/query     - Query the RAG bot")
    print("   GET  /api/status    - Check system status")
    print("   POST /api/similar   - Get similar documents")
    print("=" * 60)
    
    if rag_bot:
        print("✅ RAG Bot initialized successfully!")
        print("🤖 Ready to answer groundwater and farming questions!")
    else:
        print("❌ RAG Bot failed to initialize!")
        print("🔧 Please check your FAISS index and API keys!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
