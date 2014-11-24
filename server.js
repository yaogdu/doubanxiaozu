var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

var debug = require('debug')('myejs');

if (cluster.isMaster) {
	console.log('[master] ' + "start master...");

	for (var i = 0; i < numCPUs; i++) {
		 cluster.fork();
	}

	cluster.on('listening', function (worker, address) {
		console.log('[master] ' + 'listening: worker' + worker.id + ',pid:' + worker.process.pid + ', Address:' + address.address + ":" + address.port);
	});

} else if (cluster.isWorker) {
	var domain = require('domain');
	
	var serverDomain = domain.create();
	
	console.log('[worker] ' + "start worker ..." + cluster.worker.id);
	//http.createServer(function (req, res) {
	//	console.log('worker'+cluster.worker.id);
	//	res.end('worker'+cluster.worker.id+',PID:'+process.pid);
	//}).listen(3000);
	serverDomain.run(function() {
		var app = require('./app');
		app.set('port', process.env.PORT || 3000);
		var server = app.listen(app.get('port'), function() { 
			  var reqd = domain.create();
			  reqd.add(app);
			  reqd.on('error', function(er,req,res) {
				  //console.error('Error', er, req.url);
				  try {
					res.writeHead(500);
					res.end('Error occurred, sorry.');
				  } catch (er) {
					console.error('Error sending 500', er, req.url);
				  }
			});
		    console.log('worker'+cluster.worker.id);
		    debug('Express server listening on port ' + server.address().port);
		});
	});

}