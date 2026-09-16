package com.quickclip.app.keyboard

import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.quickclip.app.R
import com.quickclip.app.data.entity.ContentItemEntity

class ContentListAdapter(
    private val onClick: (ContentItemEntity) -> Unit,
) : RecyclerView.Adapter<ContentListAdapter.VH>() {
    private val items = mutableListOf<ContentItemEntity>()

    fun submit(list: List<ContentItemEntity>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val tv = TextView(parent.context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
            setPadding(24, 24, 24, 24)
            textSize = 14f
        }
        return VH(tv)
    }

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        val demo = if (item.isDemo) " [${holder.itemView.context.getString(R.string.demo_badge)}]" else ""
        val fav = if (item.favorite) " ★" else ""
        (holder.itemView as TextView).text = "${item.title}$fav$demo\n${item.type}"
        holder.itemView.setOnClickListener { onClick(item) }
    }

    class VH(view: View) : RecyclerView.ViewHolder(view)
}
