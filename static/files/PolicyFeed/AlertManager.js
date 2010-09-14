
PolicyFeed = PolicyFeed || {};

PolicyFeed.AlertManager = {};

PolicyFeed.AlertManager.addAlert = function(form, callback) {

     jQuery.post(WEB_URL + "/", {
            call: "PolicyFeed/Alerts/Manager.addAlert",
            format: "json",
            email: form.elements.email.value,
            query: form.elements.query.value
        },
        function(data, status) { callback(form, data, status); },
        "json"
        );

     return false;
}


/**
 *
 */
PolicyFeed.AlertManager.addedToList = function(form, data, status) {
    
    form.elements.query.value = "";
    jQuery(form.elements.submit).after("Naujiena užsakyta");

    var html = '<tr>';
    html += '<td nowrap="nowrap">' + data.time + '</td>';
    html += '<td><a href="' + WEB_URL + '/docs/search/?q=' + data.query + '">' + data.query + '</a></td>';
    html += '<td><a href="' + WEB_URL + '/?call=PolicyFeed/Alerts/Manager.remove&id=' + data.id + '">atsisakyti</a></td>';
    html += '</tr>';

    jQuery("#alerts > tbody").append(html);
   
}


/**
 *
 */
PolicyFeed.AlertManager.addedFromSearch = function(form, data, status) {
    
    form.elements.email.value = "Pranešimai užsakyti.";

}

