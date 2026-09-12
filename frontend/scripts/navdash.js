import { replace_from_url, setup_select_input } from "./tools/utils.js";
import CategoryChart from "./components/category-chart.js";

export default class DashboardView {
    #jquery;
    #category_chart;
    #date_ref;

    constructor(jquery, category_chart) {
        this.#jquery = jquery;
        this.#category_chart = category_chart;
        
        // jquery.on não deve ser utilizado pelo conteúdo a ser movido
        jquery.on('change', '.select-card', async () => await this.updateCard());
        jquery.on('change', '#filter-transaction', async () => await this.updateTransactions());
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos - Estáticos
    static async create() {
        let jquery = $(await $.get('/ui/navdash.html'));
        let parent = jquery.find('#chart-category');

        // atualizando cartões
        let jselect_card = jquery.find('.select-card');
        let cards = (await pywebview.api.model.getCards()).data;
        for(const i in cards) {
            const card = cards[i];
            jselect_card.append(`<option value="${card.id}">${card.name}</option>`)
        }

        // configurando UI
        setup_select_input(jquery, 'filter-transaction', 'filter-transaction-group', 'btn-filter-transaction-group');
        replace_from_url(jquery);

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

        return new DashboardView(jquery, category_chart);
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos
    jquery() { return this.#jquery; }

    async updateCard() {
        let response = await pywebview.api.model.getInvoiceByCard({
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
        const response = await pywebview.api.model.getBalance({date_ref: this.#date_ref});
        
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
        let response = await pywebview.api.model.getValuesByCategory({
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

        let response = await pywebview.api.model.getRegistries(params); // TODO: adicionar verificação em caso de erro e agendar função para quando a conexão retornar
        const html_item = `
        <div class="transaction-item card p-3 flex-row align-items-center column-gap-2">
            <div class="w-100 d-flex flex-column">
                <span {{TITLE_HIDDEN}} class="transaction-item-title">{{TITLE}}</span>
                <div class="d-flex column-gap-2 align-items-center">
                    <div class="transaction-item-desc-icon d-flex align-items-center"><div class="replace" url="/imgs/icons/calendar.svg"></div></div>
                    <span class="transaction-item-desc-text">{{DATE}}</span>
                    <div class="transaction-item-desc-icon {{RESPONSABLE_HIDDEN}} d-flex align-items-center"><div class="replace" url="/imgs/icons/person-fill.svg"></div></div>
                    <span class="transaction-item-desc-text {{RESPONSABLE_HIDDEN}}">{{RESPONSABLE}}</span>
                    <div class="transaction-item-desc-icon {{CARD_HIDDEN}} d-flex align-items-center"><div class="replace" url="/imgs/icons/credit-card.svg"></div></div>
                    <span class="transaction-item-desc-text {{CARD_HIDDEN}}">{{CARD}}</span>
                </div>
            </div>
            <span class="transaction-item-coin">R$</span>
            <span class="transaction-item-value" data-type-in="{{TYPE_IN}}">{{VALUE}}</span>
        </div>
        `;

        const html_group = `
        <div class="accordion" id="{{ACCORDION_ID}}">
            <div class="accordion-item">
                <div class="accordion-header d-flex p-3 align-items-center column-gap-2">
                    <span class="transaction-item-title me-auto">{{TITLE}}</span>
                    <span class="transaction-item-coin">R$</span>
                    <span class="transaction-item-value" data-type-in="{{TYPE_IN}}">{{VALUE}}</span>
                    <button class="btn btn-rotate p-0 border-0" type="button" data-bs-toggle="collapse" data-bs-target="#{{ACCORDION_ID}}-trigger"
                        aria-controls="{{ACCORDION_ID}}-trigger" aria-expanded="false">
                        <div class="replace" url="/imgs/icons/chevron-up.svg"></div>
                    </button>
                </div>
                <div id="{{ACCORDION_ID}}-trigger" class="accordion-collapse collapse" data-bs-parent="#{{ACCORDION_ID}}">
                    <div class="accordion-body pt-0 d-flex flex-column row-gap-3"></div>
                </div>
            </div>
        </div>
        `;

        let rows = {};
        response.data.forEach(item => {
            let key = `${item.title}-${item.type_in}`;
            if (key in rows) {
                rows[key].items.push(item);
                rows[key].sum += item.value;
            } else {
                rows[key] = {
                    items: [item],
                    sum: item.value,
                    type_in: item.type_in,
                    title: item.title,
                };
            }
        });

        let jquery_container = this.#jquery.find('#container-transactions-content').html('');

        // gerando elementos UI
        for (const key in rows) {
            const group = rows[key];

            // caso tenha apenas um item com esse título
            if (group.items.length == 1) {
                let item = group.items[0];

                jquery_container.append(html_item
                    .replaceAll('{{TITLE}}', item.title)
                    .replaceAll('{{TITLE_HIDDEN}}', '')
                    .replaceAll('{{DATE}}', item.occurrence_formatted.substring(0, 9))
                    .replaceAll('{{RESPONSABLE}}', item.responsable_name)
                    .replaceAll('{{RESPONSABLE_HIDDEN}}', item.responsable_name? '' : 'd-none')
                    .replaceAll('{{CARD}}', item.installment_formatted)
                    .replaceAll('{{CARD_HIDDEN}}', item.installment_formatted? '' : 'd-none')
                    .replaceAll('{{VALUE}}', item.value.toLocaleString('pt-BR', {minimumFractionDigits: 2}))
                    .replaceAll('{{TYPE_IN}}', item.type_in)
                );

            // caso tenha mais de um item com o mesmo título
            } else {
                let group_id = crypto.randomUUID();
                let jquery_group = jquery_container.append(html_group
                    .replaceAll('{{ACCORDION_ID}}', group_id)
                    .replaceAll('{{TITLE}}', group.title)
                    .replaceAll('{{VALUE}}', group.sum.toLocaleString('pt-BR', {minimumFractionDigits: 2}))
                    .replaceAll('{{TYPE_IN}}', group.type_in)
                );

                let jquery_group_container_items = jquery_group.find(`#${group_id}-trigger .accordion-body`);

                group.items.forEach(item => {
                    jquery_group_container_items.append(html_item
                        .replaceAll('{{TITLE}}', item.title)
                        .replaceAll('{{TITLE_HIDDEN}}', 'hidden')
                        .replaceAll('{{DATE}}', item.occurrence_formatted.substring(0, 9))
                        .replaceAll('{{RESPONSABLE}}', item.responsable_name)
                        .replaceAll('{{RESPONSABLE_HIDDEN}}', item.responsable_name? '' : 'd-none')
                        .replaceAll('{{CARD}}', item.installment_formatted)
                        .replaceAll('{{CARD_HIDDEN}}', item.installment_formatted? '' : 'd-none')
                        .replaceAll('{{VALUE}}', item.value.toLocaleString('pt-BR', {minimumFractionDigits: 2}))
                        .replaceAll('{{TYPE_IN}}', item.type_in)
                    );
                });
            }
        }

        this.#jquery.find('#num-transactions').text(response.data.length);
        await replace_from_url(this.#jquery);
    }

    async syncData(date_ref) {
        this.#date_ref = date_ref;

        await this.updateCategories();
        await this.updateCard();
        await this.updateBalance();
        await this.updateTransactions();
    }

    //-----------------------------------------------------------------------------
    // Eventos

    //-----------------------------------------------------------------------------
    // Métodos Privados

    //-----------------------------------------------------------------------------
}