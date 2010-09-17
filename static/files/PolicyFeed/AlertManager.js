
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

    if (!jQuery("#message")) {
        jQuery("#page > div > h1").after('<p id="message" class="message"></p>');
    }

    jQuery("#message").html(data.message);
    jQuery("#message").fadeOut(1, function() { jQuery("#message").fadeIn(500); } );

    var item = data.alert;

    var html = '<tr>';
    html += '<td nowrap="nowrap">' + item.time + '</td>';
    html += '<td><a href="' + WEB_URL + '/docs/search/?q=' + item.query + '">' + item.query + '</a></td>';
    html += '<td><a href="' + WEB_URL + '/?call=PolicyFeed/Alerts/Manager.remove&id=' + item.id + '">atsisakyti</a></td>';
    html += '</tr>';

    jQuery("#alerts > tbody").append(html);
   
}


/**
 *
 */
PolicyFeed.AlertManager.addedFromSearch = function(form, data, status) {

    form.elements.email.value = "";

    if (!jQuery("#subscribe-message").length) {
        jQuery("#result-subscribe").append('<p id="subscribe-message" class="message"></p>');
    }
    var html = data.message;
    if (data.link) {
        html = '<a href="' + data.link + '">' + html + '</a>';
    }
    jQuery("#subscribe-message").html(html);
    jQuery("#subscribe-message").fadeOut(1, function() { jQuery("#subscribe-message").fadeIn(500) });
}

