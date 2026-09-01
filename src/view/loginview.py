from src.model.appmodel import AppModel

class LoginView:
    def auth(self, username, password):
        return AppModel.getInstance().auth(username, password)

    def createAccount(self, data):
        server = AppModel.getInstance()
        return server.createAccount(data)