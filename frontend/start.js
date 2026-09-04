process.env.PORT ||= '4050';
process.argv.push('start', '--hostname', '0.0.0.0');

require('next/dist/bin/next');
