import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CFG_FILE = os.path.join(os.environ['TEMP'], 'financeiro.cfg')

EVT_CONNECTION_RESTORED = 'appmodel:connnection-restored'
EVT_CONNECTION_BROKEN = 'appmodel:connection-broken'