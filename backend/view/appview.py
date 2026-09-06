import webview

from backend.model.appmodel import AppModel
from backend.model.consts import BASE_DIR

class AppView:
    class UI:
        LOGIN = 1 << 1
        HOME = 1 << 2
        ERROR = 1 << 3

    def __init__(self):
        self._model = AppModel.getInstance()
        self._window = webview.create_window(
            title='Financeiro', 
            url=str(BASE_DIR / 'frontend/index.html'), # define a pasta frontend como root do server
            js_api=self,
            width=1400,
            height=800
        )

    @property
    def model(self): return self._model

    def getWindow(self): return self._window

    def setUiById(self, ui:UI):
        match ui:
            case self.UI.LOGIN: self._window.load_url('/ui/login.html')
            case self.UI.HOME:  self._window.load_url('/ui/home.html')
            case self.UI.ERROR:  self._window.load_url('/ui/error.html')

    def setOfflineMode(self, arg:bool):
        cmd = '''
        $("[connection-trigger]").attr("disabled", {{OFFLINE}})
        if (window.view) {
            window.view.setOfflineMode({{OFFLINE}});
        }
        '''.replace('{{OFFLINE}}', 'true' if arg else 'false')

        self._window.evaluate_js(cmd)
