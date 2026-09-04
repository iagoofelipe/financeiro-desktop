from configparser import ConfigParser
import requests
import os
from dotenv import load_dotenv
from threading import Thread

from backend.model.consts import BASE_DIR, CFG_FILE
from backend.model.server import ServerAPI

class AppModel(ServerAPI):
    _instance = None

    def __init__(self):
        load_dotenv(BASE_DIR / '.env')

        super().__init__()
        self._check_connection = True

    @classmethod
    def getInstance(cls):
        if cls._instance is None:
            cls._instance = AppModel()
        return cls._instance

    def close(self):
        self._check_connection = False

    def initialize(self):
        if not self.checkConnection():
            return False

        if not os.path.exists(CFG_FILE):
            return True
        
        config = ConfigParser()
        with open(CFG_FILE) as f:
            config.read_file(f)

        if not config.has_option('Authentication', 'username') or not config.has_option('Authentication', 'password'):
            return True

        self.auth(config['Authentication']['username'], config['Authentication']['password'])
        return True

    def getUserFullName(self) -> str: return self._user.fullname if self._user else ''

    def auth(self, username:str, password:str, remember=False):
        if not super().auth(username, password):
            return False

        if remember:
            with open(CFG_FILE, 'w') as f:
                cfg = ConfigParser()
                cfg.update({'Authentication': {'username': username, 'password': password}})
                cfg.write(f)

        return True

    def createAccount(self, data:dict) -> tuple[bool, str]:
        success = super().createAccount(**data)
        return success, (self._error if not success else '')

    def getInvoiceByCard(self, params:dict):
        response = dict(success=False, error='', data=None)
        r = requests.get(self._host+'/getInvoiceByCard', params, headers=self._headers)

        if r.status_code == 200:
            response['success'] = True
            response['data'] = r.json()
        else:
            response['error'] = r.json()['detail']

        return response

    def getCards(self):
        data = super().getCards(parse_dataclass=False)
        success = data is not None
        return dict(success=success, error='' if success else self._error, data=data)

    def getBalance(self, params):
        response = dict(success=False, error='', data=None)
        r = requests.get(self._host+'/balance', params, headers=self._headers)

        if r.status_code == 200:
            response['success'] = True
            response['data'] = r.json()
        else:
            response['error'] = r.json()['detail']

        return response

    def getValuesByCategory(self, params):
        params['parse_dataclass'] = False
        data = super().valuesByCategory(**params)
        success = data is not None
        return dict(success=success, error='' if success else self._error, data=data)