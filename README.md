# PolicyFeed #

PolicyFeed is an opensource news aggregator built for aggregating and extracting information from government websites.

## Installation ##

**Requirements:** java, ant.

**To set up a freshly downloaded system run:**

    $ ant install

## Starting servers ##

### Linux ###

This should start all three processes (Website, Crawler and Solr):

    $ bin/start-all.sh

You should see a Crawler console. Website and Solr will be forked to background. Their PIDs will be written to `data/www.pid` and `data/solr.pid`. Output will be logged to `data/log/www-server.log` and `data/log/solr-server.log`.

Now open your browser at http://localhost:8080/

_Note: Solr server will be running alongside on port 8081._

### Other platforms ###

Look inside shell scripts in bin/ directory and try runing the `java -jar ...` commands yourself.

## Credits ##

Website and Crawler are built on <a href="http://ringojs.org/">RingoJS</a> platform.

<b>Java libraries used:</b>

* <a href="http://lucene.apache.org/solr/">Solr</a>
* <a href="http://htmlunit.sourceforge.net/">HtmlUnit</a>
* <a href="http://www.zentus.com/sqlitejdbc/">SqliteJDBC</a>
* <a href="http://sourceforge.net/projects/ltstemmer/">Lithuanian Stemmer</a>

<b>RingoJS packages:</b>

* <a href="http://github.com/robi42/ringo-mail">ringo-mail</a>
* <a href="http://github.com/hns/berkeleystore">berkeleystore</a>

## License ##

PolicyFeed government news aggregator
Copyright (C) 2009,2010 Emilis Dambauskas, emilis.d@gmail.com

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

## Team ##

<a href="http://manovalstybe.lt/en/">ManoValstybė.lt</a> - we build internet tools for civil society in Lithuania.

* Emilis Dambauskas - idea, website, crawler development.
* Rapolas Binkis - web and user experience design.
* Žygimantas Medelis - search server (Solr integration, Lithuanian Stemmer, etc.).

_And all the others who helped us get funding, funded us, provide feedback and support while we are building it._

