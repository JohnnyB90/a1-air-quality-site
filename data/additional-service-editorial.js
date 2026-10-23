const profiles = {...require('./additional-services-sc'), ...require('./additional-services-nc'), ...require('./additional-services-ga'), ...require('./additional-services-tn')};
const faqs = require('./additional-service-faqs');
const local = require('./location-editorial');
const plans = require('./location-plans');
const keys = {lead: 'lead', radon: 'radon', air: 'indoor-air-quality', commercial: 'commercial-industrial'};
if (Object.keys(profiles).length !== Object.keys(plans).length) throw new Error('Additional service inventory differs from city inventory');
module.exports = Object.fromEntries(Object.keys(plans).map(slug => {
  const record = profiles[slug];
  if (!record) throw new Error(`Missing additional services: ${slug}`);
  return [slug, Object.fromEntries(Object.entries(keys).map(([short, type]) => {
    const value = record[short];
    if (!value || value.length !== 4 || value[2].split('|').length !== 3 || !faqs[type][value[3]]) throw new Error(`Invalid service brief: ${slug} ${type}`);
    return [type, {heading: value[0], brief: short === 'air' ? `${local[slug].air} ${value[1]}` : value[1], preparation: value[2].split('|'), faq: faqs[type][value[3]]}];
  }))];
}));
