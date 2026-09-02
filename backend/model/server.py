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

@dataclass
class Card:
    id:int
    name:str
    closing_day:int
    first_name:str
    last_name:str

class ServerAPI:
    def __init__(self):
        self._headers = {}
        self._user = None
        self._host = os.environ.get('API_HOST', 'http://127.0.0.1:8000/api')

    #---------------------------------------------------------------
    # EndPoints
    def auth(self, username:str, password:str) -> bool:
        response = requests.post(self._host+'/auth', {'username': username, 'password': password})
        success = response.status_code == 200

        if success:
            self._headers = {'Authorization': f'Token {response.json()['token']}'}
            self.getUser()
        else:
            self._headers.clear()

        return success
        
    def createAccount(self, username:str, password:str, email:str, first_name:str, last_name:str) -> tuple[bool, str]:
        data = dict(username=username, password=password, email=email, first_name=first_name, last_name=last_name)
        response = requests.post(self._host+'/createAccount', json=data)
        success = response.status_code == 200
        return success, (response.json()['detail'] if not success else '')
        
    def deleteAccount(self) -> bool:
        return requests.post(self._host+'/deleteAccount', headers=self._headers).status_code == 200
        
    def getUser(self) -> User | None:
        response = requests.get(self._host+'/getUser', headers=self._headers)
        if response.status_code != 200:
            return

        user = response.json()
        self._user = User(**user, fullname=f'{user['first_name']} {user['last_name']}')
        return self._user
        
    # def getUser(self) -> User: raise NotImplementedError()
    # def getUser(self) -> User: raise NotImplementedError()
    # def getUser(self) -> User: raise NotImplementedError()
    # def getUser(self) -> User: raise NotImplementedError()
    # def getUser(self) -> User: raise NotImplementedError()
    #---------------------------------------------------------------
    def logout(self):
        self._user = None
        self._headers.clear()

    @property
    def user(self) -> User | None: return self._user
    @property
    def authenticated(self) -> bool: bool(self._user)

if __name__ == '__main__':
    os.environ['API_HOST'] = 'http://192.168.1.22:8000/api'
    api = ServerAPI()

    # print(api.auth('iago', '1234'))

    # print(api.createAccount('iagof', '1234', 'iago@email.com', 'Iago', 'Carvalho'))

    # print(api.auth('iagof', '1234'))
    # print(api.deleteAccount())

    print(api.auth('iago', '1234'))
    print(api.user)

