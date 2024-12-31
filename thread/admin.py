from django.contrib import admin
from .models import (
    Thread,
    ThreadImage,
    Like,
    Repost,
    Comment,
    RepostComment,
    CommentImage,
    Follow,
    LikeComment,
    Notification,
)


# Define an Inline for ThreadImages
class ThreadImageInline(admin.TabularInline):
    model = ThreadImage


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    inlines = [ThreadImageInline]
    list_display = ["user", "content", "created_at"]
    list_filter = ["user"]
    search_fields = ["content"]


class CommentImageInline(admin.TabularInline):
    model = CommentImage


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    inlines = [CommentImageInline]
    list_display = ["user", "content", "created_at"]
    list_filter = ["user"]
    search_fields = ["content"]


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ["user", "thread", "created_at"]
    list_filter = ["user"]


@admin.register(LikeComment)
class LikeCommentAdmin(admin.ModelAdmin):
    list_display = ["user", "comment", "created_at"]
    list_filter = ["user"]


@admin.register(Repost)
class RepostAdmin(admin.ModelAdmin):
    list_display = ["user", "thread", "created_at"]
    list_filter = ["user"]


@admin.register(RepostComment)
class RepostAdmin(admin.ModelAdmin):
    list_display = ["user", "comment", "created_at"]
    list_filter = ["user"]


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ["follower", "followed", "created_at"]
    list_filter = ["follower"]


@admin.register(Notification)
class LikeAdmin(admin.ModelAdmin):
    list_display = ["content"]
    list_filter = ["user"]
