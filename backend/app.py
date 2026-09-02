import webview
import sys

from backend.model.appmodel import AppModel
from backend.view.appview import AppView
from backend.controller.appcontroller import AppController

class FinanceiroApp:
    def __init__(self):
        self._model = AppModel.getInstance()
        self._view = AppView()
        self._controller = AppController(self._view)

    def exec(self):
        webview.start(self._controller.initialize, http_server=True, debug=len(sys.argv) > 1 and  sys.argv[1] == 'DEBUG')
        # webview.start(self._controller.initialize, http_server=True)
