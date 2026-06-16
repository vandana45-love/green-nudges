"""Pytest configuration: add apps/api to sys.path for local imports."""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent))
