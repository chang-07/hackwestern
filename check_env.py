import sys
import subprocess
import os

def check_environment():
    print("=== Python Environment Check ===")
    print(f"Python executable: {sys.executable}")
    print(f"Python version: {sys.version}")
    
    # Check if we're in a virtual environment
    print(f"\n=== Virtual Environment Check ===")
    print(f"In virtual environment: {hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)}")
    print(f"sys.prefix: {sys.prefix}")
    if hasattr(sys, 'base_prefix'):
        print(f"sys.base_prefix: {sys.base_prefix}")
    
    # Check important environment variables
    print("\n=== Environment Variables ===")
    for var in ['PATH', 'VIRTUAL_ENV', 'PYTHONPATH']:
        print(f"{var}: {os.environ.get(var, 'Not set')}")
    
    # Check if we can import required packages
    print("\n=== Package Check ===")
    packages = ['flask', 'flask_cors', 'python-dotenv', 'google-generativeai']
    for pkg in packages:
        try:
            __import__(pkg.replace('-', '_'))
            print(f"✅ {pkg} is installed")
        except ImportError:
            print(f"❌ {pkg} is NOT installed")

if __name__ == "__main__":
    check_environment()
