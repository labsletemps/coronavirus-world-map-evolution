import time
from datetime import datetime, timedelta
import locale

locale.setlocale(locale.LC_ALL, 'fr_FR.UTF-8')
today_timestamp = datetime.now().strftime('%Y-%m-%d')
yesterday_timestamp = ( datetime.now() - timedelta(days=1) ).strftime('%Y-%m-%d')
yesterday_fr = ( datetime.now() - timedelta(days=1) ).strftime('%-d %B')

with open( 'index.html.twig' , 'r') as f:
    content = f.read()

    now = str(int(round(time.time() * 1000)))

    content = content.replace('UPDATE', now)

    content = content.replace('_TODAY_', today_timestamp)

    with open( 'update/index.html.twig', 'w') as fp:
        fp.write( content )

with open( 'js/map.js' , 'r') as f:
    content = f.read()

    now = str(int(round(time.time() * 1000)))

    content = content.replace('UPDATE', now)

    with open( 'update/map.js', 'w') as fp:
        fp.write( content )

with open( 'js/mapCH.js' , 'r') as f:
    content = f.read()

    now = str(int(round(time.time() * 1000)))

    content = content.replace('UPDATE', now)
    content = content.replace('_YESTERDAY-FR_', yesterday_fr)
    content = content.replace('_YESTERDAY_', yesterday_timestamp)

    with open( 'update/mapCH.js', 'w') as fp:
        fp.write( content )

with open( 'js/animatedBarChartRelative.js' , 'r') as f:
    content = f.read()

    now = str(int(round(time.time() * 1000)))

    content = content.replace('UPDATE', now)

    with open( 'update/animatedBarChartRelative.js', 'w') as fp:
        fp.write( content )
