from backend.model.appmodel import AppModel
from backend.view.appview import AppView
from backend.event import EventTarget

class AppController(EventTarget):
    def __init__(self, view:AppView):
        super().__init__()
        self._view = view
        self._model = AppModel.getInstance()

        self._view.getWindow().events.closed += self._model.close

    def initialize(self):
        if not self._model.initialize():
            ui = AppView.UI.ERROR
        elif self._model.authenticated:
            ui = AppView.UI.HOME
        else:
            ui = AppView.UI.LOGIN

        self._view.setUiById(ui)
