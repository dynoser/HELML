"""Class for encoding-decoding HELML format"""

from __future__ import annotations

try:
    from HELML import _version

    __version__ = _version.__version__
except Exception:
    __version__ = ""

from HELML._helml import HELML

__all__ = [
    "HELML"
]
