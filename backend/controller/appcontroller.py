from backend.model.appmodel import AppModel
from backend.view.appview import AppView
from backend.model.consts import EVT_CONNECTION_RESTORED, EVT_CONNECTION_BROKEN

class AppController:
    def __init__(self, view:AppView):
        self._view = view
        self._model = AppModel.getInstance()

        self._view.getWindow().events.closed += self._model.close
        self._model.events.bind(EVT_CONNECTION_RESTORED, self.on_connectionRestored)
        self._model.events.bind(EVT_CONNECTION_BROKEN, self.on_connectionBroken)

    def initialize(self):
        if not self._model.initialize():
            ui = AppView.UI.ERROR
        elif self._model.authenticated:
            ui = AppView.UI.HOME
        else:
            ui = AppView.UI.LOGIN

        self._view.setUiById(ui)

    def on_connectionRestored(self):
        # caso já tenha ido para HOME
        if self._model.authenticated:
            self._view.setOfflineMode(False)

        # caso tenha dados para a autenticação
        elif self._model.tryAuthenticateFromCache():
            self._view.setUiById(AppView.UI.HOME)

        # retorna para a tela de login
        else:
            self._view.setUiById(AppView.UI.LOGIN)

    def on_connectionBroken(self):
        self._view.setOfflineMode(True)