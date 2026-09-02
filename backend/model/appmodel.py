from configparser import ConfigParser
import requests
import os
from dotenv import load_dotenv
from threading import Thread

from backend.model.consts import BASE_DIR, CFG_FILE
from backend.event import EventTarget

class AppModel(EventTarget):
    _instance = None

    def __init__(self):
        super().__init__()
        self._headers = {}
        self._error = ''
        self._authenticated = False
        load_dotenv(BASE_DIR / '.env')
        self._check_connection = True

        self._host = os.environ.get('API_HOST', 'http://127.0.0.1:8000/api')

    @classmethod
    def getInstance(cls):
        if cls._instance is None:
            cls._instance = AppModel()
        return cls._instance

    def close(self):
        print('closing the application...')
        self._check_connection = False

    def initialize(self):
        # checking server connection
        try:
            requests.get(self._host)
        except (requests.exceptions.ConnectTimeout, requests.exceptions.ConnectionError):
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

    @property
    def authenticated(self): return self._authenticated

    def auth(self, username:str, password:str, remember=False):
        response = requests.post(self._host+'/auth', {'username': username, 'password': password})
        self._authenticated = response.status_code == 200

        if self._authenticated:
            self._headers = {'Authorization': f'Token {response.json()['token']}'}
            self._user = requests.get(self._host+'/getUser', headers=self._headers).json()
            self._user['fullname'] = f'{self._user['first_name']} {self._user['last_name']}'

        else:
            self._headers.clear()

        if remember:
            with open(CFG_FILE, 'w') as f:
                cfg = ConfigParser()
                cfg.update({'Authentication': {'username': username, 'password': password}})
                cfg.write(f)

        return self._authenticated

    def logout(self):
        self._authenticated = False
        self._headers.clear()

    def createAccount(self, data:dict) -> tuple[bool, str]:
        response = requests.post(self._host+'/createAccount', json=data)
        success = response.status_code == 200
        return success, (response.json()['detail'] if not success else '')

    def getUserFullName(self): return self._user['fullname']

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
        response = dict(success=False, error='', data=None)
        r = requests.get(self._host+'/getCards', headers=self._headers)

        if r.status_code == 200:
            response['success'] = True
            response['data'] = r.json()
        else:
            response['error'] = r.json()['detail']

        return response

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
        response = dict(success=False, error='', data=None)
        r = requests.get(self._host+'/valuesByCategory', params, headers=self._headers)

        if r.status_code == 200:
            response['success'] = True
            response['data'] = r.json()
        else:
            response['error'] = r.json()['detail']

        return response