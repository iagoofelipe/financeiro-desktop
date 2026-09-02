import webview
from enum import Enum, auto

from src.model.appmodel import AppModel
from src.model.consts import BASE_DIR

class AppView:
    class UI:
        Login = 1 << 1
        Home = 1 << 2

    def __init__(self):
        self._model = AppModel.getInstance()
        self._window = webview.create_window(
            title='Financeiro', 
            url=str(BASE_DIR / 'assets/index.html'), # define a pasta assets como root do server
            js_api=self,
            width=1400,
            height=800
        )

    @property
    def model(self): return self._model

    def setUiById(self, ui:UI):
        match ui:
            case self.UI.Login: self._window.load_url('/ui/login.html')
            case self.UI.Home:  self._window.load_url('/ui/home.html')