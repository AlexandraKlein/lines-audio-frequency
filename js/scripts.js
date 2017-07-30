//window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

var renderers = {

    'linesContainer': (function() {
        var lines = [];
        var initialized = false;
        var height = 0;
        var width = 0;

        var init = function(config) {
            var count = config.count;
            width = config.width;
            height = config.height;
            linesEl = document.getElementById('lines');
            for(var i = 0; i < count; i++ ){
                var node = document.createElement('div');
                node.style.width = node.style.height = (i/count*width) + 'px';
                node.classList.add('line');
                lines.push(node);
                linesEl.appendChild(node);
            }
            initialized = true;
        };
        var max = 255;

        var renderFrame = function(frequencyData) {
            for(var i = 0; i < lines.length; i++) {
                var line = lines[i];
                //console.log(frequencyData[i]);

                function setVendor(element, property, value) {
                    element.style[property] = value;
                    element.style['-webkit-' + property] = value;
                    element.style['-moz-' + property] = value;
                    element.style['-ms-' + property] = value;
                    element.style['-o-' + property] = value;
                }

                setVendor(line, 'transform', 'scale('+((frequencyData[i]/max))+')');
            }
        };

        return {
            init: init,
            isInitialized: function() {
                return initialized;
            },
            renderFrame: renderFrame
        }
    })()
};

window.onload = function() {

    function Visualization(config) {
        var audio,
            audioStream,
            analyser,
            source,
            audioCtx,
            canvasCtx,
            frequencyData,
            running = false,
            renderer = config.renderer,
            width = config.width || 320,
            height = config.height || 320;

        var init = function() {
            audio = document.getElementById('audio');
            audioCtx = new AudioContext();
            analyser = audioCtx.createAnalyser();
            source =  audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            analyser.fftSize = 64;
            frequencyData = new Uint8Array(analyser.frequencyBinCount);
            renderer.init({
                count: analyser.frequencyBinCount,
                width: width,
                height: height
            });

            audio.crossOrigin = "anonymous";
        };
        this.start = function() {
            audio.play();
            running = true;
            renderFrame();
        };
        this.stop = function() {
            running = false;
            audio.pause();
        };
        this.setRenderer = function(r) {
            if (!r.isInitialized()) {
                r.init({
                    count: analyser.frequencyBinCount,
                    width: width,
                    height: height
                });
            }
            renderer = r;
        };
        this.isPlaying = function() {
            return running;
        };

        var renderFrame = function() {
            analyser.getByteFrequencyData(frequencyData);
            renderer.renderFrame(frequencyData);
            if (running) {
                requestAnimationFrame(renderFrame);
            }
        };

        init();

    }
    var vis = document.querySelectorAll('.initiator');
    var v = null;
    var lastEl;
    var lastElparentId;

    for(var i=0; i<vis.length; i++) {
        vis[i].onclick = (function() {

            return function() {
                var el = this;
                var id = el.parentNode.id;

                if (!v) {
                    v = new Visualization({renderer: renderers[id] });
                }
                v.setRenderer(renderers[id]);
                if (v.isPlaying()) {
                    if (lastElparentId === id) {
                        v.stop();
                    }
                } else {
                    v.start();
                }
                lastElparentId = id;
                lastEl = el;
            };
        })();
    }
};