#!/bin/bash
set -e

# Check if SDK path is provided
if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/smartspectra/sdk"
    echo "Please provide the path to your SmartSpectra SDK installation."
    exit 1
fi

SDK_PATH="$1"

# Verify SDK directory structure
if [ ! -d "$SDK_PATH/include/SmartSpectra" ] || [ ! -d "$SDK_PATH/lib" ]; then
    echo "Error: Invalid SmartSpectra SDK directory."
    echo "Expected to find include/SmartSpectra/ and lib/ directories in $SDK_PATH"
    exit 1
fi

# Create build directory
mkdir -p build
cd build

# Configure with CMake
echo "Configuring build with SmartSpectra SDK at: $SDK_PATH"
cmake .. -DCMAKE_BUILD_TYPE=Release -DSMARTSPECTRA_ROOT="$SDK_PATH"

# Build the project
echo "Building the project..."
make -j$(nproc)

# Create a Python package
echo "Creating Python package..."
mkdir -p ../python/smartspectra
cp tracker.*.so ../python/smartspectra/
cp ../smartspectra_wrapper/__init__.py ../python/smartspectra/

echo ""
Build complete! The Python module is in the 'python' directory.

To use the module, add it to your PYTHONPATH:

export PYTHONPATH="$(pwd)/python:$PYTHONPATH"

Then you can import it in Python:

    from smartspectra import tracker
    health_tracker = tracker.HealthTracker()
"""

# Create a virtual environment and install dependencies
echo "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install -r ../smartspectra_requirements.txt

echo ""
Setup complete! Activate the virtual environment with:

    source venv/bin/activate

Then you can run the test script:

    python test_tracker.py
"""
