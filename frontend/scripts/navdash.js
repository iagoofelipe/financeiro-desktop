import { setup_select_input } from "./tools/utils.js";
import CategoryChart from "./components/category-chart.js";

export default class DashboardView {
    #jquery;
    #category_chart;
    #date_ref;

    constructor(jquery, category_chart, jfilter_month_year) {
        this.#jquery = jquery;
        this.#category_chart = category_chart;
        this.#date_ref = jfilter_month_year.val() + '-01';
        
        // jquery.on não deve ser utilizado pelo conteúdo a ser movido
        jfilter_month_year.on('change', async (e) => await this.#on_filterMonthYear_changed(e));
        jquery.on('change', '.select-card', async () => await this.updateCard());
        jquery.on('change', '#filter-transaction', async () => await this.updateTransactions());
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos - Estáticos
    static async create(jfilter_month_year) {
        let jquery = $(await $.get('/ui/navdash.html'));
        let parent = jquery.find('#chart-category');

        // atualizando cartões
        let jselect_card = jquery.find('.select-card');
        let cards = (await window.pywebview.api.model.getCards()).data;
        for(const i in cards) {
            const card = cards[i];
            jselect_card.append(`<option value="${card.id}">${card.name}</option>`)
        }

        // configurando UI
        setup_select_input(jquery, 'filter-transaction', 'filter-transaction-group', 'btn-filter-transaction-group');

        let category_chart = new CategoryChart({
            data: {in: [], out: []},
            filterOptions: [
                {value:'out', text: 'Saídas'},
                {value: 'in', text: 'Entradas'},
            ],
            fieldLabel: 'title',
            fieldData: 'total',
            appendTo: parent,
            dataAsObject: true,
        });

        let obj = new DashboardView(jquery, category_chart, jfilter_month_year);
        
        await obj.updateCard();
        await obj.updateCategories();
        await obj.updateBalance();
        await obj.updateTransactions();

        return obj;
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos
    jquery() { return this.#jquery; }

    async updateCard() {
        let response = await window.pywebview.api.model.getInvoiceByCard({
            field: 'id',
            q: this.#jquery.find('.select-card option:selected').val(),
            date_ref: this.#date_ref,
        });

        if (response.success) {
            this.#jquery.find('.field-card-accounted .text').text(response.data.sum_registred_formatted);
            this.#jquery.find('.field-card-pending .text').text(response.data.sum_pending_formatted);
            this.#jquery.find('.field-card-closing-date .text').text(response.data.closing_date_formatted);
            this.#jquery.find('.field-card-due-date .text').text(response.data.due_date_formatted);
        } else {
            this.#jquery.find('.field-card-accounted .text').text('-');
            this.#jquery.find('.field-card-pending .text').text('-');
            this.#jquery.find('.field-card-closing-date .text').text('-');
            this.#jquery.find('.field-card-due-date .text').text('-');
        }
    }

    async updateBalance() {
        const response = await window.pywebview.api.model.getBalance({date_ref: this.#date_ref});
        
        if (response.success) {
            this.#jquery.find('.value-in').text(response.data.total_in_formatted);
            this.#jquery.find('.value-out').text(response.data.total_out_formatted);
            this.#jquery.find('.value-balance').text(response.data.total_balance_formatted);

            if (response.data.total_in_progress_description) {
                this.#jquery.find('.value-in-note').show();
                this.#jquery.find('.value-in-note .icon-progress').prop('hidden', !response.data.total_in_progress);
                this.#jquery.find('.value-in-note .icon-not-progress').prop('hidden', response.data.total_in_progress);
                this.#jquery.find('.value-in-note .text').text(response.data.total_in_progress_description);
            }
            else this.#jquery.find('.value-in-note').hide();

            if (response.data.total_out_progress_description) {
                this.#jquery.find('.value-out-note').show();
                this.#jquery.find('.value-out-note .icon-progress').prop('hidden', !response.data.total_out_progress);
                this.#jquery.find('.value-out-note .icon-not-progress').prop('hidden', response.data.total_out_progress);
                this.#jquery.find('.value-out-note .text').text(response.data.total_out_progress_description);
            }
            else this.#jquery.find('.value-out-note').hide();

        } else {
            this.#jquery.find('.value-in').text('0');
            this.#jquery.find('.value-out').text('0');
            this.#jquery.find('.value-balance').text('0');
        }
    }

    async updateCategories() {
        let response = await window.pywebview.api.model.getValuesByCategory({
            date_ref: this.#date_ref,
            limit: 5,
        });

        this.#category_chart.setValues(response.success? response.data : {in: [], out: []});
    }

    async updateTransactions() {
        let params = { date_ref: this.#date_ref };
        let type_in = this.#jquery.find('#filter-transaction').val();

        if (type_in == 'in')        params.type_in = 1;
        else if (type_in == 'out')  params.type_in = 0;

        let response = await window.pywebview.api.model.getRegistries(params);
        let struct = `
        <hr>
        <div class="d-flex align-items-center column-gap-2">
            <div class="w-100 d-flex flex-column">
                <span class="fs-5">{{TITLE}}</span>
                <div class="d-flex column-gap-2 align-items-center" style="color: var(--bs-tertiary-color);">
                    <svg height="18" width="18" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-calendar" viewBox="0 0 16 16">
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                    </svg>
                    <span>{{DATE}}</span>
                    <svg height="20" width="20" {{HIDDEN_RESPONSABLE}} xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                    </svg>
                    <span {{HIDDEN_RESPONSABLE}}>{{RESPONSABLE}}</span>
                    <svg {{HIDDEN_CARD}} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_143_1010)">
                        <path d="M17.4999 3.33334H2.49992C1.57944 3.33334 0.833252 4.07954 0.833252 5.00001V15C0.833252 15.9205 1.57944 16.6667 2.49992 16.6667H17.4999C18.4204 16.6667 19.1666 15.9205 19.1666 15V5.00001C19.1666 4.07954 18.4204 3.33334 17.4999 3.33334Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M0.833252 8.33334H19.1666" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_143_1010">
                        <rect width="20" height="20" fill="white"/>
                        </clipPath>
                        </defs>
                    </svg>
                    <span {{HIDDEN_CARD}}>{{CARD}}</span>
                </div>
            </div>
            <span class="title-3">R$</span>
            <span class="fs-3" style="color: {{VALUE_COLOR}};">{{VALUE}}</span>
        </div>
        `;

        let jquery = this.#jquery.find('#container-transactions-content').html('');
        for (const i in response) {
            const data = response[i];
            jquery.append(struct
                .replaceAll('{{TITLE}}', data.title)
                .replaceAll('{{DATE}}', data.occurrance_formatted)
                .replaceAll('{{HIDDEN_RESPONSABLE}}', data.responsable_name? '' : 'hidden')
                .replaceAll('{{RESPONSABLE}}', data.responsable_name)
                .replaceAll('{{VALUE_COLOR}}', data.type_in? '#60a060' : '#bb3636')
                .replaceAll('{{VALUE}}', data.value_formatted.substring(3)) // ignora 'RS '
                .replaceAll('{{HIDDEN_CARD}}', data.installment_formatted? '' : 'hidden')
                .replaceAll('{{CARD}}', data.installment_formatted)
            );
        }

        console.log(this.#jquery.find('#num-transactions').text(response.length));
        console.log(response)
    }

    //-----------------------------------------------------------------------------
    // Eventos
    async #on_filterMonthYear_changed(evt) {
        this.#date_ref = evt.currentTarget.value + '-01';

       await this.updateCategories();
       await this.updateCard();
       await this.updateBalance();
    }

    //-----------------------------------------------------------------------------
    // Métodos Privados

    //-----------------------------------------------------------------------------
}