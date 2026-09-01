
import webview

from src.model.appmodel import AppModel
from src.view.appview import AppView
from src.controller.appcontroller import AppController

class FinanceiroApp:
    def __init__(self):
        self._model = AppModel.getInstance()
        self._view = AppView()
        self._controller = AppController(self._view)

    def exec(self):
        # webview.start(self._controller.initialize, http_server=True, debug=True)
        webview.start(self._controller.initialize, http_server=True)
