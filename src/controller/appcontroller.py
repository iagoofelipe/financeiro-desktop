from src.model.appmodel import AppModel
from src.view.appview import AppView

class AppController:
    def __init__(self, view:AppView):
        self._view = view
        self._model = AppModel.getInstance()

    def initialize(self):
        self._model.initialize()
        self._view.setUiById(AppView.UI.Home if self._model.authenticated else AppView.UI.Login)
