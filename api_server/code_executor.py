"""
Safe code execution server for AI-powered data analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
import sys
import io
import traceback
import os
from contextlib import redirect_stdout, redirect_stderr
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js

# Load the dataset once at startup
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'conference-app', 'public', 'conference_talks_cleaned.csv')
df = None

def load_data():
    global df
    try:
        df = pd.read_csv(DATA_PATH)
        print(f"✅ Loaded {len(df):,} talks from {DATA_PATH}")
        return True
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'rows': len(df) if df is not None else 0})

@app.route('/execute', methods=['POST'])
def execute_code():
    """
    Execute Python code safely and return results
    """
    data = request.json
    code = data.get('code', '')
    
    if not code:
        return jsonify({'error': 'No code provided'}), 400
    
    # Create safe execution environment
    safe_globals = {
        'pd': pd,
        'df': df.copy() if df is not None else None,  # Give code a copy
        'json': json,
        'plt': plt,
        '__builtins__': {
            'print': print,
            'len': len,
            'str': str,
            'int': int,
            'float': float,
            'list': list,
            'dict': dict,
            'set': set,
            'tuple': tuple,
            'range': range,
            'enumerate': enumerate,
            'zip': zip,
            'sorted': sorted,
            'sum': sum,
            'min': min,
            'max': max,
            'round': round,
            'abs': abs,
        }
    }
    
    # Capture stdout/stderr
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    result = {
        'success': False,
        'output': '',
        'error': None,
        'data': None,
        'charts': []
    }
    
    try:
        # Execute code
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            exec(code, safe_globals)
        
        # Get output
        result['output'] = stdout_capture.getvalue()
        
        # Extract result variable if it exists
        if 'result' in safe_globals and safe_globals['result'] is not None:
            res = safe_globals['result']
            
            # Convert pandas objects to JSON-serializable format
            if isinstance(res, pd.DataFrame):
                result['data'] = {
                    'type': 'dataframe',
                    'columns': res.columns.tolist(),
                    'data': res.to_dict('records')
                }
            elif isinstance(res, pd.Series):
                result['data'] = {
                    'type': 'series',
                    'data': res.to_dict()
                }
            elif isinstance(res, dict):
                result['data'] = {
                    'type': 'dict',
                    'data': res
                }
            elif isinstance(res, (list, tuple)):
                result['data'] = {
                    'type': 'list',
                    'data': list(res)
                }
            else:
                result['data'] = {
                    'type': 'value',
                    'data': str(res)
                }
        
        # Capture any matplotlib plots
        if plt.get_fignums():
            for fig_num in plt.get_fignums():
                fig = plt.figure(fig_num)
                buf = BytesIO()
                fig.savefig(buf, format='png', dpi=100, bbox_inches='tight')
                buf.seek(0)
                img_base64 = base64.b64encode(buf.read()).decode('utf-8')
                result['charts'].append(img_base64)
                plt.close(fig)
        
        result['success'] = True
        
    except Exception as e:
        result['error'] = {
            'message': str(e),
            'traceback': traceback.format_exc(),
            'stderr': stderr_capture.getvalue()
        }
    
    return jsonify(result)

@app.route('/data-info', methods=['GET'])
def data_info():
    """
    Return information about the dataset schema
    """
    if df is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    info = {
        'shape': df.shape,
        'columns': df.columns.tolist(),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'sample': df.head(3).to_dict('records'),
        'description': {
            'title': 'Talk title',
            'speaker': 'Speaker name',
            'calling': 'Speaker calling/position',
            'year': 'Year of conference (integer)',
            'season': 'Season (April or October)',
            'url': 'URL to talk on churchofjesuschrist.org',
            'talk': 'Full text of the talk',
            'footnotes': 'Footnotes text',
            'calling_original': 'Original calling text',
            'topics': 'JSON array of topic labels (from NLP)',
            'topic_scores': 'JSON array of topic confidence scores',
            'primary_topic': 'Top topic',
            'primary_topic_score': 'Confidence score for top topic',
            'emotions': 'JSON array of emotion labels (from NLP)',
            'emotion_scores': 'JSON array of emotion confidence scores',
            'primary_emotion': 'Top emotion',
            'primary_emotion_score': 'Confidence score for top emotion',
            'all_emotion_scores': 'JSON object with all 28 emotion scores'
        }
    }
    
    return jsonify(info)

if __name__ == '__main__':
    print("🚀 Starting Code Execution Server...")
    if load_data():
        print(f"📊 Dataset info:")
        print(f"   Rows: {len(df):,}")
        print(f"   Columns: {df.columns.tolist()}")
        print("\n🌐 Server ready at http://localhost:5001")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("❌ Failed to load data. Exiting.")
        sys.exit(1)

