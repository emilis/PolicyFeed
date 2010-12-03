/*
    Copyright 2010 Emilis Dambauskas

    This file is part of KąVeikiaValdžia.lt website.

    KąVeikiaValdžia.lt is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    KąVeikiaValdžia.lt is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with KąVeikiaValdžia.lt.  If not, see <http://www.gnu.org/licenses/>.
*/


var savivaldybes = [
    ["Akmenė", "Akmenės rajonas", "Akmenė"],
    ["Alytaus m.", "Alytaus miestas", "Alytus"],
    ["Alytaus r.", "Alytaus rajonas"],
    ["Anykščių r.", "Anykščių rajonas", "Anykščiai"],
    ["Birštonas", "Birštonas"],
    ["Biržų r.", "Biržų rajonas", "Biržai"],
    ["Druskininkai", "Druskininkai"],
    ["Elektrėnai", "Elektrėnai"],
    ["Ignalinos r.", "Ignalinos rajonas", "Ignalina"],
    ["Jonavos r.", "Jonavos rajonas", "Jonava"],
    ["Joniškio r.", "Joniškio rajonas", "Joniškis"],
    ["Jurbarko r.", "Jurbarko rajonas", "Jurbarkas"],
    ["Kaišiadorių r.", "Kaišiadorių rajonas", "Kaišiadorys"],
    ["Kalvarija", "Kalvarija"],
    ["Kauno m.", "Kauno miestas", "Kaunas"],
    ["Kauno r.", "Kauno rajonas"],
    ["Kazlų Rūda", "Kazlų Rūda"],
    ["Kėdainių r.", "Kėdainių rajonas", "Kėdainiai"],
    ["Kelmės r.", "Kelmės rajonas", "Kelmė"],
    ["Klaipėdos m.", "Klaipėdos miestas", "Klaipėda"],
    ["Klaipėdos r.", "Klaipėdos rajonas"],
    ["Kretingos r.", "Kretingos rajonas", "Kretinga"],
    ["Kupiškio r.", "Kupiškio rajonas", "Kupiškis"],
    ["Lazdijų r.", "Lazdijų rajonas", "Lazdijai"],
    ["Marijampolė", "Marijampolė"],
    ["Mažeikių r.", "Mažeikių rajonas", "Mažeikiai"],
    ["Molėtų r.", "Molėtų rajonas", "Molėtai"],
    ["Neringa", "Neringa", "Nida"],
    ["Pagėgiai", "Pagėgiai"],  
    ["Pakruojo r.", "Pakruojo rajonas", "Pakruojis"],
    ["Palangos m.", "Palangos miestas", "Palanga"],
    ["Panevėžio m.", "Panevėžio miestas", "Panevėžys"],
    ["Panevėžio r.", "Panevėžio rajonas"],
    ["Pasvalio r.", "Pasvalio rajonas", "Pasvalys"],
    ["Plungės r.", "Plungės rajonas", "Plungė"],
    ["Prienų r.", "Prienų rajonas", "Prienai"],
    ["Radviliškio r.", "Radviliškio rajonas", "Radviliškis"],
    ["Raseinių r.", "Raseinių rajonas", "Raseiniai"],
    ["Rietavas", "Rietavas"],
    ["Rokiškio r.", "Rokiškio rajonas", "Rokiškis"],
    ["Skuodo r.", "Skuodo rajonas", "Skuodas"],
    ["Šakių r.", "Šakių rajonas", "Šakiai"],
    ["Šalčininkų r.", "Šalčininkų rajonas", "Šalčininkai"],
    ["Šiaulių m.", "Šiaulių miestas", "Šiauliai"],
    ["Šiaulių r.", "Šiaulių rajonas"],
    ["Šilalės r.", "Šilalės rajonas", "Šilalė"],
    ["Šilutės r.", "Šilutės rajonas", "Šilutė"],
    ["Širvintų r.", "Širvintų rajonas", "Širvintos"],
    ["Švenčionių r.", "Švenčionių rajonas", "Švenčionys"],
    ["Tauragės r.", "Tauragės rajonas", "Tauragė"],
    ["Telšių r.", "Telšių rajonas", "Telšiai"],
    ["Trakų r.", "Trakų rajonas", "Trakai"],
    ["Ukmergės r.", "Ukmergės rajonas", "Ukmergė"],
    ["Utenos r.", "Utenos rajonas", "Utena"],
    ["Varėnos r.", "Varėnos rajonas", "Varėna"],
    ["Vilkaviškio r.", "Vilkaviškio rajonas", "Vilkaviškis"],
    ["Vilniaus m.", "Vilniaus miestas"],
    ["Vilniaus r.", "Vilniaus rajonas"],
    ["Visaginas", "Visaginas"],
    ["Zarasų r.", "Zarasų rajonas", "Zarasai"]
];

savivaldybes = savivaldybes.map(function (item) {
        item[2] = item[2] || "";
        item = {
            group: item[0],
            title: item[1],
            queries: item[2]
            };
        item.query = 'orgroups:"' + item.group + '","' + item.title + '"';
        if (item.queries) {
            item.query += ',"' + item.queries + '"';
        }
        return item;
    });

exports.list = function() {
    return savivaldybes;
}
