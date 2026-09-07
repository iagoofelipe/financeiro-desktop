// import RegistryView from "./nav-regs/view.js";
import DashboardView from "./navdash.js";
import { load_theme, replace_from_url, switch_theme } from "./tools/utils.js";
// import CreditCardView from "./cards.js";

// await load_theme();

class IView {
    setOfflineMode() { throw new Error("NOT_IMPLEMENTED"); }
}

class HomeView
{
    #date_ref;
    #view;
    #minsLastUpdate;
    #timeoutId;

    constructor(user, year_month) {
        let nav_btns = $('.home-nav .nav-link');
        const jdate_ref = $('#filter-month-year');

        // atualizando valores
        $('.user-full-name').text(user);
        jdate_ref.val(year_month);
        this.#date_ref = year_month + '-01';
        this.#minsLastUpdate = 0;
        
        // vinculando eventos
        nav_btns.on('click', async (evt) => await this.#on_navBtn_clicked(evt));
        // $('#btn-nav-collapse').click(this.#on_btnNavCollapse_clicked);
        $('#btn-theme').click(switch_theme);
        $('#btn-sync').click(async () => await this.syncData());
        $('.home-nav.offcanvas .nav-link').click(() => { $('.home-nav.offcanvas .close').click() });
        jdate_ref.on('change', async (e) => await this.#on_filterDateRef_changed(e));
        
        // selecionando primeira nav
        $(nav_btns[0]).click();
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos - Estáticos
    static async create() {
        await replace_from_url(document);

        // coletando dados do backend
        const user = await pywebview.api.model.getUserFullName();
        const year_month = await pywebview.api.model.getDefaultYearMonth();
        
        window.view = new HomeView(user, year_month);

        return window.view;
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos
    async logout() {
        await pywebview.api.model.logout();
        window.location.href = '/ui/login.html';
    }

    async syncData() {
        $('#last-update').text('atualizando dados...');
        await this.#view.syncData(this.#date_ref);
        this.#minsLastUpdate = 0;
        $('#last-update').text('atualizado há menos de 1min');
        this.#timeoutId = setInterval(async () => await this.#on_syncData_timeout(), 60000);
    }

    async #on_syncData_timeout() {
        this.#minsLastUpdate++;
        if (this.#minsLastUpdate >= 60) {
            $('#last-update').text('atualizado há mais de 1h atrás');
            clearTimeout(this.#timeoutId); // trava a mensagem
        }
        else {
            $('#last-update').text(`atualizado ${this.#minsLastUpdate}min atrás`);
        }
    }

    setOfflineMode(arg) {
        if (arg)
            this.toastMessage('Erro de Conexão', 'agora', 'Não foi possível processar a solicitação, aguardando reconexão...');
        else    
            this.toastMessage('Conexão Reestabelecida', 'agora', 'A conexão foi retomada com sucesso');
    }

    toastMessage(title, subtitle, msg) {
        $('.toast-title').text(title);
        $('.toast-subtitle').text(subtitle);
        $('.toast-body').text(msg);

        const toastLiveExample = document.getElementById('liveToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
        toastBootstrap.show();
    }

    //-----------------------------------------------------------------------------
    // Eventos
    async #on_navBtn_clicked(evt) {
        evt.preventDefault();

        let jbtn = $(evt.currentTarget);
        let title = jbtn.prop('name');

        switch (title) {
        case 'Dashboards':
            this.#view = await DashboardView.create();
            break;

        // case 'Registros':
        //     this.#view = await RegistryView.create();
        //     break;

        // case 'Cartões e Faturas':
        //     let cardsview = await CreditCardView.create(parent);
        //     break;

        case 'Sair':
            await this.logout();
            return;

        default:
            console.log('nav option unset', title);
            return;
        }
        
        $('#home-title').text(title); // atualizando título

        // atualizando botão selecionado
        $('.home-nav .nav-link-active').removeClass('nav-link-active');
        $(`.home-nav .nav-link[name="${title}"]`).addClass('nav-link-active');
        
        // atualizando conteúdo
        let jquery = this.#view.jquery();
        $('#home-content').html(jquery);

        let navtop = jquery.find('#home-navtop-content');
        if (navtop.length)
            $('#home-navtop').html(navtop).show();
        else
            $('#home-navtop').hide();

        // atualizando dados
        await this.syncData();
    }

    // #on_btnNavCollapse_clicked(evt) {
    //     $('.home-nav').toggleClass('collapsed');
    // }

    async #on_filterDateRef_changed(evt) {
        this.#date_ref = evt.currentTarget.value + '-01';
        await this.syncData();
    }
    //-----------------------------------------------------------------------------
}

if (window.pywebview && window.pywebview.api)
        await HomeView.create();
    else
        window.addEventListener('pywebviewready', HomeView.create);