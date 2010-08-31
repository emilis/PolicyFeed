/*
    Copyright 2009,2010 Emilis Dambauskas

    This file is part of Cheap Tricks Library for RingoJS.

    Cheap Tricks Library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Cheap Tricks Library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Cheap Tricks Library.  If not, see <http://www.gnu.org/licenses/>.
*/

// Requirements:
importClass(org.jibble.pircbot.PircBot);

if (!pb)
    var pb = JavaAdapter(PircBot, {});

exports.config = {};

exports.getBot = function()
{
    return pb;
}

exports._constructor = function(config)
{
    this.config = config;

    if (!pb.isConnected())
    {
        pb.setName(config.name);

        if (config.login)
            pb.setLogin(config.login);
        if (config.version)
            pb.setVersion(config.version);

        if (config.encoding)
            pb.setEncoding(config.encoding);

        if (config.verbose != undefined)
            pb.setVerbose(config.verbose);

        pb.connect(config.server);

        if (config.identify)
            pb.identify(config.identify);

        this.joinChannels(config.channels);
    }
}


exports.joinChannels = function(channels)
{
    if (typeof(channels) == "string")
        return this.joinChannel(channels);
    else if (channels.map)
    {
        return channels.map(function(channel)
        {
            return this.joinChannel(channel);
        });
    }
    else
        return false;
}


exports.joinChannel = function(channel)
{
    return pb.joinChannel(channel);
}

exports.partChannel = function(channel)
{
    return pb.partChannel(channel);
}

exports.sendMessages = function(targets, message)
{
    if (targets == undefined)
        return false;
    if (typeof(targets) == "string")
        return this.sendMessage(targets, message);
    else if (targets.map)
    {
        return targets.map(function (target)
        {
            return this.sendMessage(target, message);
        });
    }
    else
        return false;
}

exports.sendMessage = function(target, message)
{
    return pb.sendMessage(target, message);
}

exports.quit = function()
{
    return pb.quitServer();
}
