from configparser import ConfigParser
import requests
import os

class AppModel:
    _instance = None

    def __init__(self):
        self._token = ''
        self._error = ''
        self._host = 'http://127.0.0.1:8000/api'
        self._authenticated = False

    @classmethod
    def getInstance(cls):
        if cls._instance is None:
            cls._instance = AppModel()
        return cls._instance

    def initialize(self):
        file = os.path.join(os.environ['TEMP'], 'financeiro.cfg')

        if not os.path.exists(file):
            return
        
        config = ConfigParser()
        with open(file) as f:
            config.read_file(f)

        if not config.has_option('Authentication', 'username') or not config.has_option('Authentication', 'password'):
            return

        self.auth(config['Authentication']['username'], config['Authentication']['password'])


    @property
    def authenticated(self): return self._authenticated

    def auth(self, username:str, password:str):
        response = requests.post(self._host+'/auth', {'username': username, 'password': password})
        success = response.status_code == 200
        self._token = response.json()['token'] if success else ''
        self._authenticated = success
        return success

    def logout(self):
        self._authenticated = False
        self._token = ''

    def createAccount(self, data:dict) -> tuple[bool, str]:
        response = requests.post(self._host+'/createAccount', json=data)
        success = response.status_code == 200
        return success, (response.json()['detail'] if not success else '')

