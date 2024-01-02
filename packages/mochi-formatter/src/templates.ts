type TransactionTemplate =
  | "transferIn"
  | "transferOut"
  | "transferGlobal"
  | "deposit"
  | "withdraw"
  | "airdropWithParticipant"
  | "airdropWithoutParticipant"
  | "airdropReceive"
  | "paylinkWithoutSender"
  | "paylinkWithSender"
  | "paymeWithoutSender"
  | "paymeWithSender"
  | "paymeWithSenderSuccess";

const transactionTemplate: Record<TransactionTemplate, string> = {
  transferIn: "%s from %s",
  transferOut: "%s to %s",
  transferGlobal: "%s to %s",

  deposit: "%s deposited from `%s`",
  withdraw: "%s withdrawn to `%s`",

  airdropWithParticipant: "%s airdropped to %d %s",
  airdropWithoutParticipant: "%s airdropped but no one joined",
  airdropReceive: "%s from %s",

  paylinkWithoutSender: "%s [Pay Link](%s/pay/%s)",
  paylinkWithSender: "%s [Pay Link](%s/pay/%s) to %s",

  paymeWithoutSender: "%s [Pay Me](%s/pay)",
  paymeWithSender: "%s [Pay Me](%s/pay) request sent to %s",
  paymeWithSenderSuccess: "%s [Pay Me](%s/pay) from %s",
};

export default {
  transaction: transactionTemplate,
};
