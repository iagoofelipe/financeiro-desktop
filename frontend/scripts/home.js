// import RegistryView from "./nav-regs/view.js";
import DashboardView from "./navdash.js";
import { replace_from_url } from "./tools/utils.js";
// import CreditCardView from "./cards.js";

$(async () => {
    await replace_from_url(document);
    $('.user-full-name').text(await window.pywebview.api.model.getUserFullName());

    let home_view = new HomeView();
});

class HomeView
{
    constructor() {
        // configurando nav-btns
        let nav_btns = $('.home-nav .nav-link');
        
        nav_btns.on('click', async (evt) => await this.#on_navBtn_clicked(evt));
        $(nav_btns[0]).click();
        $('#btn-nav-collapse').click(this.#on_btnNavCollapse_clicked);

        $('.home-nav.offcanvas .nav-link').click(() => { $('.home-nav.offcanvas .close').click() });
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