from dataclasses import dataclass
import requests, os

@dataclass
class User:
    id:int
    username:str
    email:str
    first_name:str
    last_name:str
    fullname: str
    _dict:dict

@dataclass
class Card:
    id:int
    name:str
    closing_day:int
    due_day:int
    limit:float
    closing_previous_month:bool

@dataclass
class StatisticsCategory:
    title:str
    total:float
    total_formatted:str

def connection_error(func):
    def wrapper(self, *args, **kwargs):
        try:
            r = func(self, *args, **kwargs)
        except requests.ConnectionError as e:
            if self._conn_error_cb:
                self._conn_error_cb()
            if self._conn_error_keep_exception:
                raise e
            return {'success': False, 'error': 'erro de conexão com o servidor'}
        return r
    return wrapper

class ServerAPI:
    def __init__(self, conn_error_cb=None, conn_error_keep_exception=True):
        self._headers = {}
        self._user = None
        self._host = os.environ.get('API_HOST', 'http://127.0.0.1:8000/api')
        self._authenticated = False
        self._conn_error_cb = conn_error_cb
        self._conn_error_keep_exception = conn_error_keep_exception

        if not conn_error_cb and not conn_error_keep_exception:
            raise ValueError('caso conn_error_keep_exception seja False, conn_error_cb deve ser especificado')

    def logout(self):
        self._user = None
        self._authenticated = False
        self._headers.clear()

    #---------------------------------------------------------------
    # propriedades
    @property
    def user(self) -> User | None: return self._user
    @property
    def authenticated(self) -> bool: return self._authenticated

    def checkConnection(self):
        try:
            success = requests.get(self._host+'/checkApi').status_code == 200
        except (requests.exceptions.ConnectTimeout, requests.exceptions.ConnectionError):
            success = False

        return success

    #---------------------------------------------------------------
    # EndPoints

    # Account
    @connection_error
    def auth(self, username:str, password:str) -> bool:
        response = requests.post(self._host+'/auth', {'username': username, 'password': password})
        success = response.status_code == 200

        if success:
            self._headers = {'Authorization': f'Token {response.json()['token']}'}
            self.getUser()
        else:
            self.logout()

        return success
        
    def createAccount(self, params:dict):
        return self._request('POST', '/createAccount', default_headers=False, data_from_response=False, json=params)
        
    def deleteAccount(self):
        return self._request('POST', '/deleteAccount', data_from_response=False)
        
    @connection_error
    def getUser(self) -> User | None:
        response = requests.get(self._host+'/getUser', headers=self._headers)
        self._authenticated = response.status_code == 200

        if not self._authenticated:
            self._error = response.json()['detail']
            return

        user = response.json()
        user['fullname'] = f'{user['first_name']} {user['last_name']}'
        self._user = User(**user, _dict=user)

        return self._user
        
    # Card
    def getCards(self):
        return self._request('GET', '/getCards')
        
    def getCardById(self, id:int):
        return self._request('GET', f'/getCard/{id}')

    def addCard(self, params:dict):
        return self._request('POST', '/addCard', json=params)

    # Invoice
    def getInvoices(self): raise NotImplementedError()
    def getInvoiceById(self, id:int): raise NotImplementedError()

    def getInvoiceByCard(self, params={}) -> dict:
        return self._request('GET', '/getInvoiceByCard', params=params)

    # Installment
    def updateInstallmentsAll(self): raise NotImplementedError()

    # Registry
    def getRegistries(self, params={}):
        return self._request('GET', '/getRegistries', params=params)

    def getRegistryById(self, id:int): raise NotImplementedError()
    def addRegistry(self): raise NotImplementedError()
    def hasRegistries(self): raise NotImplementedError()
    def deleteRegistryById(self, id:int): raise NotImplementedError()
    def updateRegistry(self): raise NotImplementedError()

    # Responsable
    def getResponsables(self): raise NotImplementedError()
    def getResponsableById(self, id:int): raise NotImplementedError()
    def addResponsable(self): raise NotImplementedError()

    # Statistics
    def getValuesByCategory(self, params={}):
        return self._request('GET', '/valuesByCategory', params=params)

    def getBalance(self, params={}):
        return self._request('GET', '/balance', params=params)

    #---------------------------------------------------------------
    @connection_error
    def _request(self, method:str, endpoint:str, default_headers=True, data_from_response=True, **kwargs):
        if default_headers:
            kwargs['headers'] = self._headers

        match method:
            case 'GET':     response = requests.get(self._host+endpoint, **kwargs)
            case 'POST':    response = requests.get(**kwargs)
            case _:         raise ValueError(f'{method} invalid')
            
        result = dict(success=response.status_code == 200, error='', data=None)

        if not result['success']:
            result['error'] = response.json()['detail']
        elif data_from_response:
            result['data'] = response.json()

        return result

if __name__ == '__main__':
    def conn_error_cb():
        print('erro de conexão')

    api = ServerAPI(conn_error_cb=conn_error_cb, conn_error_keep_exception=True)
    print(api.auth('iago', '1234'))
