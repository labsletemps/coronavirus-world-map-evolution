import time

with open( 'index.html.twig' , 'r') as f:
    content = f.read()

    now = str(int(round(time.time() * 1000)))

    content = content.replace('UPDATE', now)

    with open( 'update/index.html.twig', 'w') as fp:
        fp.write( content )

with open( 'js/map.js' , 'r') as f:
    content = f.read()

    now = str(int(round(time.time() * 1000)))

    content = content.replace('UPDATE', now)

    with open( 'update/map.js', 'w') as fp:
        fp.write( content )
