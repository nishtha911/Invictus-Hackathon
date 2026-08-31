import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))
from app.graph.nodes import _try_parse_number
print("36 ->", _try_parse_number("36"))
print("10 years ->", _try_parse_number("10 years"))
