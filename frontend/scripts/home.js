// import RegistryView from "./nav-regs/view.js";
import DashboardView from "./navdash.js";
import { load_theme, replace_from_url, switch_theme } from "./tools/utils.js";
// import CreditCardView from "./cards.js";

await load_theme();

class IView {
    setOfflineMode() { throw new Error("NOT_IMPLEMENTED"); }
}

class HomeView
{
    constructor() {
        // configurando nav-btns
        let nav_btns = $('.home-nav .nav-link');
        
        nav_btns.on('click', async (evt) => await this.#on_navBtn_clicked(evt));
        $(nav_btns[0]).click();

        // vinculando eventos
        $('#btn-nav-collapse').click(this.#on_btnNavCollapse_clicked);
        $('#btn-theme').click(async () => await switch_theme());

        $('.home-nav.offcanvas .nav-link').click(() => { $('.home-nav.offcanvas .close').click() });
    }

    static async create() {
        await replace_from_url(document);

        $('.user-full-name').text(await window.pywebview.api.model.getUserFullName());
        $('#filter-month-year').val(await window.pywebview.api.model.getDefaultYearMonth());
        
        return new HomeView();
    }

    async logout() {
        await window.pywebview.api.model.logout();
        window.location.href = '/ui/login.html';
    }

    async #on_navBtn_clicked(evt) {
        evt.preventDefault();

        let jbtn = $(evt.currentTarget);
        let title = jbtn.prop('name');
        let jfilter_month_year = $('#filter-month-year');

        // atualizando conteúdo
        let new_widget;

        switch (title) {
        case 'Dashboards':
            new_widget = await DashboardView.create(jfilter_month_year);
            break;

        // case 'Registros':
        //     new_widget = await RegistryView.create(jfilter_month_year);
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
        this.#update_nav_button(title); // atualizando botão selecionado
        
        // atualizando conteúdo
        let jquery = new_widget.jquery();
        $('#home-content').html(jquery);
        $('#home-navtop').html(jquery.find('#home-navtop-content'));
    }

    #update_nav_button(name) {
        $('.home-nav .nav-link-active').removeClass('nav-link-active');
        $(`.home-nav .nav-link[name="${name}"]`).addClass('nav-link-active');
    }

    #on_btnNavCollapse_clicked(evt) {
        $('.home-nav').toggleClass('collapsed');
    }
}

if (window.pywebview && window.pywebview.api)
        window.homeView = await HomeView.create();
    else
        window.addEventListener('pywebviewready', async () => window.homeView = await HomeView.create());