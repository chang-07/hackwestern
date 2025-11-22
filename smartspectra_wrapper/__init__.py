"""
SmartSpectra Python Wrapper

This module provides Python bindings for the SmartSpectra SDK.
"""

import os
import sys
import importlib.util

# Try to import the compiled module
spec = importlib.util.find_spec(".tracker", package=__name__)
if spec is not None:
    from .tracker import HealthTracker
else:
    # If not found, try to load from the build directory
    build_dir = os.path.join(os.path.dirname(__file__), "..", "python")
    if os.path.exists(build_dir):
        sys.path.insert(0, build_dir)
        try:
            from tracker import HealthTracker
        except ImportError:
            HealthTracker = None
    else:
        HealthTracker = None

__all__ = ['HealthTracker']

if HealthTracker is None:
    import warnings
    warnings.warn(
        "Failed to import SmartSpectra tracker. "
        "Make sure to build the C++ extension first.",
        RuntimeWarning
    )
