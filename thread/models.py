from django.db import models
from django.contrib.auth.models import User
from sorl.thumbnail import ImageField


class Thread(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="thread")
    content = models.TextField(default="")
    likes_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    liked_users = models.ManyToManyField(
        User, through="Like", related_name="liked_threads", blank=True
    )
    reposted_users = models.ManyToManyField(
        User, through="Repost", related_name="reposted_threads", blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Thread: {self.content[:20]}"


class ThreadImage(models.Model):
    thread = models.ForeignKey(
        Thread, on_delete=models.CASCADE, related_name="image_thread"
    )
    image = ImageField(upload_to="thread_images/")

    def __str__(self):
        return f"Thread image of {self.thread.content[:20]}"


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensures a user can only like a thread once
        constraints = [
            models.UniqueConstraint(fields=["user", "thread"], name="unique_like")
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        super(Like, self).save(*args, **kwargs)
        # Update the like_count of the related Thread
        self.thread.likes_count = Like.objects.filter(thread=self.thread).count()
        self.thread.save()

    def __str__(self):
        return f"{self.user.username} liked {self.thread.content[:20]}"


class Repost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        # Ensures that a user can only repost thread once.
        constraints = [
            models.UniqueConstraint(
                fields=["user", "thread"], name="unique_repost_thread"
            )
        ]

    def __str__(self):
        return f"{self.user.username} reposted {self.thread.content[:20]}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment")
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="comment")
    content = models.TextField(default="")
    likes_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sub_comment",
    )
    liked_users = models.ManyToManyField(
        User, through="LikeComment", related_name="liked_comments", blank=True
    )
    reposted_users = models.ManyToManyField(
        User, through="RepostComment", related_name="reposted_comments", blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def get_comment_hierarchy(self):
        hierarchy = []
        parent_comment = self.parent_comment

        while parent_comment:
            hierarchy.insert(0, parent_comment)
            parent_comment = parent_comment.parent_comment

        return hierarchy

    def save(self, *args, **kwargs):
        # Check if this is a new comment or an existing one being updated
        is_new_comment = self._state.adding
        super(Comment, self).save(*args, **kwargs)

        if is_new_comment and not self.parent_comment:
            # Update the comment_count of the related Thread
            self.thread.comment_count = Comment.objects.filter(
                thread=self.thread, parent_comment=None
            ).count()
            self.thread.save()
        if is_new_comment and self.parent_comment:
            # Update the comment_count of the related parent comment
            self.parent_comment.comment_count = Comment.objects.filter(
                thread=self.thread, parent_comment=self.parent_comment
            ).count()
            self.parent_comment.save()

    def __str__(self):
        return f"Comment: {self.content[:20]}"


class RepostComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        # Ensures that a user can only repost comment once.
        constraints = [
            models.UniqueConstraint(
                fields=["user", "comment"], name="unique_repost_comment"
            )
        ]

    def __str__(self):
        return f"{self.user.username} reposted {self.comment.content[:20]}"


class LikeComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensures a user can only like a comment once
        constraints = [
            models.UniqueConstraint(
                fields=["user", "comment"], name="unique_like_comment"
            )
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        super(LikeComment, self).save(*args, **kwargs)
        # Update the like_count of the related comment
        self.comment.likes_count = LikeComment.objects.filter(
            comment=self.comment
        ).count()
        self.comment.save()

    def __str__(self):
        return f"{self.user.username} liked {self.comment.content[:20]}"


class CommentImage(models.Model):
    comment = models.ForeignKey(
        Comment, on_delete=models.CASCADE, related_name="comment_image"
    )
    image = ImageField(upload_to="comment_images/")

    def __str__(self):
        return f"Comment image of {self.comment.content}"


class Follow(models.Model):
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following"
    )
    followed = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="followers"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"

    class Meta:
        # Ensures that a user can only follow another user once.
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "followed"], name="unique_following"
            )
        ]


class Notification(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notification"
    )
    type = models.CharField(max_length=32)
    content = models.CharField(max_length=64)
    is_read = models.BooleanField(default=False)
    actioner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="noti",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.content}"
