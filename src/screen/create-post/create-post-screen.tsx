import { useMutation } from "@apollo/client";
import React, { useState } from "react";
import { Alert, Image, TextInput, View } from "react-native";
import { Storage } from "aws-amplify";
import { nanoid } from "nanoid";
import {
  CreatePostInput,
  CreatePostMutation,
  CreatePostMutationVariables,
} from "../../API";
import { createPost } from "../../apollo/post-mutations";
import { Button } from "../../components/button";
import { Carousel } from "../../components/carousel";
import { VideoPlayer } from "../../components/video-player";
import { useAuthContext } from "../../contexts/auth-context";
import { RootStackScreenProps } from "../../navigators";

export const CreatePostScreen = ({
  route: { params },
  navigation,
}: RootStackScreenProps<"CreatePost">) => {
  const { image, images, video } = params;
  const { userId } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [doCreatePost] = useMutation<
    CreatePostMutation,
    CreatePostMutationVariables
  >(createPost);

  const handleSubmit = async () => {
    if (!userId || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    const input: CreatePostInput = {
      type: "POST",
      description,
      image: undefined,
      images: undefined,
      video: undefined,
      nofComments: 0,
      nofLikes: 0,
      userID: userId,
    };
    // upload the media files to S3 and get the key
    if (image) {
      const imageKey = await uploadMedia(image);
      input.image = imageKey;
    }
    await doCreatePost({ variables: { input } });
    setIsSubmitting(false);
    navigation.popToTop();
  };

  const uploadMedia = async (uri: string) => {
    try {
      // get the blob of the file from uri
      const response = await fetch(uri);
      const blob = await response.blob();

      const uriParts = uri.split(".");
      const extension = uriParts[uriParts.length - 1];

      // upload the file (blob) to S3
      const s3Response = await Storage.put(`${nanoid()}.${extension}`, blob);
      return s3Response.key;
    } catch (e) {
      Alert.alert("Error uploading the file");
    }
  };

  let content = null;
  if (image) {
    content = (
      <Image
        className="w-full h-full"
        source={{
          uri: image,
        }}
      />
    );
  } else if (images) {
    content = <Carousel images={images} />;
  } else if (video) {
    content = <VideoPlayer uri={video} />;
  }

  return (
    <View className="items-center">
      <View className="w-48 h-48">{content}</View>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description..."
        multiline
        numberOfLines={5}
        className="my-2.5 self-stretch bg-white p-2.5 rounded"
      />
      <Button
        label={isSubmitting ? "Submitting" : "Submit"}
        onPress={handleSubmit}
      />
    </View>
  );
};
