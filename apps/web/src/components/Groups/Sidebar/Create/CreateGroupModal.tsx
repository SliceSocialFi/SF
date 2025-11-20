import { group } from "@lens-protocol/metadata";
import { Regex } from "@slice/data/regex";
import { useCreateGroupMutation } from "@slice/indexer";
import type { ApolloClientError } from "@slice/types/errors";
import { useCallback, useState } from "react";
import { z } from "zod";
import AvatarUpload from "@/components/Shared/AvatarUpload";
import {
  Button,
  Form,
  Input,
  TextArea,
  useZodForm
} from "@/components/Shared/UI";
import errorToast from "@/helpers/errorToast";
import uploadMetadata from "@/helpers/uploadMetadata";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import { useCreateGroupStore } from "./CreateGroup";
// import type { SimplePaymentGroupRuleConfig, GroupRulesConfigInput, GroupRuleConfig } from "@slice/indexer/generated"

const ValidationSchema = z.object({
  description: z.string().max(260, {
    message: "Description should not exceed 260 characters"
  }),
  name: z
    .string()
    .max(100, { message: "Name should not exceed 100 characters" })
    .regex(Regex.accountNameValidator, {
      message: "Account name must not contain restricted symbols"
    })
});

const CreateGroupModal = () => {
  const { setScreen, setTransactionHash } = useCreateGroupStore();
  const [pfpUrl, setPfpUrl] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleTransactionLifecycle = useTransactionLifecycle();

  const form = useZodForm({
    schema: ValidationSchema
  });

  const onCompleted = (hash: string) => {
    setIsSubmitting(false);
    setTransactionHash(hash);
    setScreen("minting");
  };

  const onError = useCallback((error: ApolloClientError) => {
    setIsSubmitting(false);
    errorToast(error);
  }, []);

  const [createGroup] = useCreateGroupMutation({
    onCompleted: async ({ createGroup }) => {
      if (createGroup.__typename === "CreateGroupResponse") {
        return onCompleted(createGroup.hash);
      }

      return await handleTransactionLifecycle({
        onCompleted,
        onError,
        transactionData: createGroup
      });
    },
    onError
  });

  const handleCreateGroup = async (data: any) => {
    setIsSubmitting(true);

    const metadataUri = await uploadMetadata(
      group({
        description: data.description || undefined,
        icon: pfpUrl,
        name: data.name
      })
    );

    // const simplePaymentRuleData: SimplePaymentGroupRuleConfig = {
    //   erc20: {
    //     currency: "0x50B4B400AbEcb21d8DCCEB74bd7E0d4C9b3F028d",
    //     value: "100"
    //   },
    //   recipient: "0x58BD27EecD3f6Bdf6f962846D954E471da47FbF4"
    // };

    // const requireds: Array<GroupRuleConfig> = [
    //   {
    //     simplePaymentRule: simplePaymentRuleData
    //   }
    // ];

    // const rulesData: GroupRulesConfigInput = {
    //   required: requireds,
    // };

    // const createGroupData = {
    //   variables: {
    //     request: {
    //       metadataUri,
    //       owner: "0x58BD27EecD3f6Bdf6f962846D954E471da47FbF4",
    //       rules: rulesData
    //     }
    //   }
    // }

    // console.log("createGroupData:", createGroupData);

    // const result = await createGroup(createGroupData);
    // console.log("createGroup result:", result);
    // return result;
    return await createGroup({
      variables: {
        request: {
          metadataUri
        }
      }
    });
  };

  return (
    <Form className="space-y-4 p-5" form={form} onSubmit={handleCreateGroup}>
      <Input label="Name" placeholder="Name" {...form.register("name")} />
      <TextArea
        label="Description"
        placeholder="Please provide additional details"
        {...form.register("description")}
      />
      <AvatarUpload
        isSmall
        setSrc={(src) => setPfpUrl(src)}
        src={pfpUrl || ""}
      />
      <Button
        className="flex w-full justify-center"
        disabled={isSubmitting}
        loading={isSubmitting}
        type="submit"
      >
        Create group
      </Button>
    </Form>
  );
};

export default CreateGroupModal;
