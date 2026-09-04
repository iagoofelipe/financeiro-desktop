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
    due_day:int
    limit:float
    closing_previous_month:bool

class ServerAPI:
    def __init__(self):
        self._headers = {}
        self._user = None
        self._host = os.environ.get('API_HOST', 'http://127.0.0.1:8000/api')
        self._error = ''
        self._authenticated = False

    def errorMessage(self) -> str: return self._error

    def logout(self):
        self._user = None
        self._authenticated = False
        self._headers.clear()

    @property
    def user(self) -> User | None: return self._user
    @property
    def authenticated(self) -> bool: return self._authenticated

    #---------------------------------------------------------------
    # EndPoints

    # Account
    def auth(self, username:str, password:str) -> bool:
        response = requests.post(self._host+'/auth', {'username': username, 'password': password})
        success = response.status_code == 200

        if success:
            self._headers = {'Authorization': f'Token {response.json()['token']}'}
            self.getUser()
        else:
            self.logout()
            self._error = response.json()['detail']

        return success
        
    def createAccount(self, username:str, password:str, email:str, first_name:str, last_name:str) -> bool:
        data = dict(username=username, password=password, email=email, first_name=first_name, last_name=last_name)
        response = requests.post(self._host+'/createAccount', json=data)
        success = response.status_code == 200
        if not success:
            self._error = response.json()['detail']
        return success
        
    def deleteAccount(self) -> bool:
        return requests.post(self._host+'/deleteAccount', headers=self._headers).status_code == 200
        
    def getUser(self) -> User | None:
        response = requests.get(self._host+'/getUser', headers=self._headers)
        self._authenticated = response.status_code == 200

        if not self._authenticated:
            self._error = response.json()['detail']
            return

        user = response.json()
        self._user = User(**user, fullname=f'{user['first_name']} {user['last_name']}')
        return self._user
        
    # Card
    def getCards(self) -> dict[Card] | None:
        response = requests.get(self._host+'/getCards', headers=self._headers)
        success = response.status_code == 200
        if not success:
            self._error = response.json()['detail']

        return { d['id']: Card(**d) for d in response.json() } if success else None
        
    def getCardById(self, id:int) -> Card:
        response = requests.get(f'{self._host}/getCard/{id}', headers=self._headers)
        success = response.status_code == 200
        if not success:
            self._error = response.json()['detail']

        return Card(**response.json()) if success else None

    def addCard(self, name:str, closing_day:int, due_day:int, limit:float, closing_previous_month:bool=None) -> Card | None:
        data = dict(name=name, closing_day=closing_day, due_day=due_day, limit=limit)
        if closing_previous_month is not None: data['closing_previous_month'] = closing_previous_month
        response = requests.post(self._host+'/addCard', json=data, headers=self._headers)
        success = response.status_code == 200
        if not success:
            self._error = response.json()['detail']

        return Card(**response.json()) if success else None

    # Invoice
    def getInvoices(self): raise NotImplementedError()
    def getInvoiceById(self, id:int): raise NotImplementedError()
    def getInvoiceByCard(self): raise NotImplementedError()

    # Installment
    def updateInstallmentsAll(self): raise NotImplementedError()

    # Registry
    def getRegistries(self): raise NotImplementedError()
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
    def valuesByCategory(self): raise NotImplementedError()
    def balance(self): raise NotImplementedError()

    #---------------------------------------------------------------

if __name__ == '__main__':
    # os.environ['API_HOST'] = 'http://192.168.1.22:8000/api'
    api = ServerAPI()

    print(api.auth('teste', '1234'))

    # print(api.createAccount('iagof', '1234', 'iago@email.com', 'Iago', 'Carvalho'))

    # print(api.auth('iagof', '1234'))
    # print(api.deleteAccount())

    # print(api.user)

    # print(api.getCards())

    # print(api.getCardById(3))

    # print(api.addCard('Cartão de Teste', 5, 10, 1500, False))
