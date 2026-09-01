import webview
from pathlib import Path
from enum import Enum, auto

from src.view.loginview import LoginView

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class AppView:
    class UI(Enum):
        Login = auto()
        Home = auto()

    def __init__(self):
        self._login_view = LoginView()

        self._window = webview.create_window(
            title='Financeiro', 
            url=(BASE_DIR / 'assets/index.html').__str__(), # define a pasta assets como root do server
            js_api=self,
            width=1400,
            height=800
        )

    @property
    def loginView(self): return self._login_view

    def setUiById(self, ui:UI):
        match ui:
            case self.UI.Login: self._window.load_url('/ui/login.html')
            case self.UI.Home: self._window.load_url('/ui/home.html')