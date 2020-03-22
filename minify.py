toLoad = ["lib/jquery-3.4.1.slim.min.js", "lib/d3.min.js", "lib/ion.rangeSlider.min.js", "lib/ion.rangeSlider.js", "lib/d3-legend.min.js", "lib/bootstrap.min.js", "lib/topojson.v2.min.js", "lib/d3-tip.js", "lib/c3.min.js", "lib/d3-zoom.min.js", "lib/d3-geo-projection.v2.min.js", "lib/queue.min.js", 
"lib/scrollmagic/main.min.js", "lib/scrollmagic/animation.gsap.min.js", "lib/scrollmagic/animation.velocity.min.js", "lib/scrollmagic/debug.addIndicators.min.js"]

def read_entirely(file):
    with open(file, 'r') as handle:
        return f'\n\n\n/*** {file} ***/\n\n' + handle.read()

result = '\n'.join(read_entirely(file) for file in toLoad)

with open("lib-merged/libraries.js", 'w') as handle:
    handle.write(result)
