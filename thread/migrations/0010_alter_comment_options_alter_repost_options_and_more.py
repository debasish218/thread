# Generated by Django 4.2.4 on 2023-08-24 08:58

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('thread', '0009_remove_recommentimage_recomment_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='comment',
            options={'ordering': ['-created_at']},
        ),
        migrations.AlterModelOptions(
            name='repost',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddField(
            model_name='thread',
            name='repost_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='comment',
            name='parent_comment',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sub_comment', to='thread.comment'),
        ),
    ]
