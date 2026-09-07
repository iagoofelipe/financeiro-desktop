import { load_theme, replace_from_url } from "./tools/utils.js";

$(async () => {
    $(document).on('click', '.btn-rotate', function(e) {
        $(e.currentTarget).toggleClass('btn-rotated');
    });

    await replace_from_url(document);
    await load_theme();
});