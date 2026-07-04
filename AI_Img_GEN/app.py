from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from urllib.parse import quote
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Pollinations.ai configuration
# ---------------------------------------------------------------------------
# Pollinations' image endpoint works with NO key at all (free tier, rate
# limited). If you have a Pollinations API key (from https://enter.pollinations.ai),
# set POLLINATIONS_API_KEY in your .env to raise your rate limits / unlock
# extra models — it's entirely optional.
POLLINATIONS_API_KEY = os.getenv("POLLINATIONS_API_KEY", "")

# Base URL for text-to-image generation.
# Full shape: https://image.pollinations.ai/prompt/{url-encoded prompt}?width=..&height=..&seed=..&model=..
POLLINATIONS_IMAGE_URL = "https://image.pollinations.ai/prompt"

DEFAULT_MODEL = "flux"  # other options include: turbo, flux-realism, etc.


def query_pollinations_api(prompt, params):
    """
    Query the Pollinations.ai image generation API.
    This is a simple GET request — Pollinations renders the image and
    streams the bytes back directly, no polling/job-id required.
    """
    encoded_prompt = quote(prompt)
    url = f"{POLLINATIONS_IMAGE_URL}/{encoded_prompt}"

    headers = {}
    if POLLINATIONS_API_KEY:
        # Pollinations accepts the key either as a Bearer header or a
        # ?key= query param — the header keeps it out of server logs/URLs.
        headers["Authorization"] = f"Bearer {POLLINATIONS_API_KEY}"

    response = requests.get(url, params=params, headers=headers, timeout=120)
    return response


@app.route('/generate', methods=['POST'])
def generate_image():
    """Generate image from prompt using Pollinations.ai (FLUX model by default)"""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        width = data.get('width', 1024)
        height = data.get('height', 1024)

        # --- Optional fields sent by the frontend's advanced settings ---
        # Pollinations' image API doesn't use "steps" the way a local
        # diffusers pipeline would (it's a hosted, already-tuned model),
        # so `steps` is accepted for compatibility but not forwarded.
        # `negative_prompt` and `seed` map directly onto Pollinations'
        # own `negative` and `seed` parameters.
        negative_prompt = data.get('negative_prompt')   # str | None
        seed = data.get('seed')                          # int | None
        model = data.get('model') or DEFAULT_MODEL        # str
        # Map the frontend's internal model id ("flux-dev") onto a real
        # Pollinations model name; anything else is passed through as-is.
        if model in ("flux-dev", "flux_dev"):
            model = "flux"
        # ------------------------------------------------------------------

        # Validation
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        print(f"Generating image via Pollinations: {prompt[:60]}...")
        print(f"Parameters: {width}x{height}, model={model}, seed={seed}")

        params = {
            "width": width,
            "height": height,
            "model": model,
            "nologo": "true",   # remove the Pollinations watermark
            "safe": "false",    # NSFW filter off/on — adjust as needed
        }
        if seed is not None:
            params["seed"] = seed
        if negative_prompt:
            params["negative"] = negative_prompt

        response = query_pollinations_api(prompt, params)

        # Check if request was successful
        if response.status_code == 429:
            return jsonify({
                'error': 'Rate limited',
                'message': 'Pollinations is rate-limiting anonymous requests. Wait a moment and try again, or add a POLLINATIONS_API_KEY to your .env.'
            }), 429

        if response.status_code == 401:
            return jsonify({
                'error': 'Invalid Pollinations API key',
                'message': 'Please check your POLLINATIONS_API_KEY is valid.'
            }), 401

        if response.status_code != 200:
            error_msg = f"API Error: {response.status_code}"
            try:
                error_data = response.json()
                err = error_data.get('error', error_msg)
                error_msg = err.get('message', error_msg) if isinstance(err, dict) else err
            except Exception:
                pass
            return jsonify({'error': error_msg}), response.status_code

        # Get image bytes
        image_bytes = response.content

        # Convert to base64 for sending to frontend (same contract the
        # frontend already expects from the previous HuggingFace backend)
        img_base64 = base64.b64encode(image_bytes).decode('utf-8')

        print("✓ Image generated successfully!")

        return jsonify({
            'success': True,
            'image': img_base64,
            'message': 'Image generated successfully'
        })

    except requests.exceptions.Timeout:
        return jsonify({
            'error': 'Request timeout',
            'message': 'The request took too long. Try a smaller image size.'
        }), 504

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': f'{DEFAULT_MODEL} via Pollinations.ai',
        'api': 'Pollinations.ai (Free, no token required)',
        'token_configured': True,  # Pollinations works without a key at all
        'api_key_set': bool(POLLINATIONS_API_KEY),
        'note': 'No local GPU or account required — generation happens on Pollinations servers'
    })


@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('views', 'index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS)"""
    return send_from_directory('views', filename)


if __name__ == '__main__':
    print("\n" + "=" * 70)
    print(" 🎨 LUMIXA IMAGE GENERATOR — powered by Pollinations.ai")
    print("=" * 70)
    print(f" Server running at: http://localhost:5000")
    print(f" Model: {DEFAULT_MODEL} (Pollinations.ai)")
    print(f" API: Pollinations.ai (Free — no signup required)")
    print("=" * 70)

    if POLLINATIONS_API_KEY:
        print("\n ✓ POLLINATIONS_API_KEY configured — higher rate limits enabled")
    else:
        print("\n ℹ️  Running without a POLLINATIONS_API_KEY (fully optional).")
        print(" Anonymous requests are rate-limited. For heavier use, get a")
        print(" free key at https://enter.pollinations.ai and add it to .env:")
        print(" POLLINATIONS_API_KEY=your_key_here\n")

    print("=" * 70 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)
