const service = require('../services/complaintService');

// Controllers only read the request and send the response; the rules live in the service.
const handle = fn => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create: handle(async (req, res) => {
    const complaint = await service.create(req.body, req.user);
    res.status(201).location(`/api/complaints/${complaint._id}`).json({ data: complaint });
  }),
  list: handle(async (req, res) => res.json(await service.list(req.query, req.user))),
  getOne: handle(async (req, res) => res.json({ data: await service.getOne(req.params.id, req.user) })),
  assign: handle(async (req, res) => res.json({ data: await service.assign(req.params.id, req.body.staffId, req.user) })),
  updateStatus: handle(async (req, res) => res.json({ data: await service.updateStatus(req.params.id, req.body.status, req.user) })),
  addComment: handle(async (req, res) => res.status(201).json({ data: await service.addComment(req.params.id, req.body.text, req.user) })),
  rate: handle(async (req, res) => res.json({ data: await service.rate(req.params.id, req.body.rating, req.user) })),
  remove: handle(async (req, res) => {
    await service.remove(req.params.id, req.user);
    res.status(204).send();
  }),
  summary: handle(async (req, res) => res.json({ data: await service.summary() }))
};
